import { one, q, pool } from './db.js';
import { scoreLead } from './services/ai.js';
import { runFraudChecks } from './services/antifraud.js';
import { formatLeadMessage, sendNotification, type ChannelType } from './services/notify.js';

/**
 * Простой воркер очереди jobs (таблица в Postgres — по спеке на MVP хватит).
 * Запуск: npm run worker. Берёт задачи через FOR UPDATE SKIP LOCKED,
 * до 3 попыток с экспоненциальной паузой.
 */

const POLL_MS = 1500;
const MAX_ATTEMPTS = 3;

interface Job { id: number; type: string; payload: Record<string, unknown>; attempts: number }

async function claimJob(): Promise<Job | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query<Job>(
      `SELECT id, type, payload, attempts FROM jobs
       WHERE status = 'pending' AND run_after <= now()
       ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1`,
    );
    const job = res.rows[0];
    if (job) {
      await client.query(`UPDATE jobs SET status = 'running', attempts = attempts + 1 WHERE id = $1`, [job.id]);
    }
    await client.query('COMMIT');
    return job ?? null;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function handleScoreLead(payload: Record<string, unknown>) {
  const leadId = String(payload.leadId);

  const lead = await one<{
    id: string; session_id: string; quiz_id: string; workspace_id: string;
    name: string | null; phone: string | null; email: string | null;
  }>('SELECT id, session_id, quiz_id, workspace_id, name, phone, email FROM leads WHERE id = $1', [leadId]);
  if (!lead) throw new Error(`Лид ${leadId} не найден`);

  const session = await one<{
    transcript: { q?: string; a?: unknown }[];
    started_at: string; finished_at: string | null; ip: string | null;
  }>('SELECT transcript, started_at, finished_at, ip FROM sessions WHERE id = $1', [lead.session_id]);
  const quiz = await one<{ business_context: Record<string, unknown>; title: string }>(
    'SELECT business_context, title FROM quizzes WHERE id = $1', [lead.quiz_id]);
  if (!session || !quiz) throw new Error('Сессия или квиз не найдены');

  // 1. Дешёвые программные проверки
  const dup = await one<{ n: string }>(
    `SELECT count(*) AS n FROM leads l JOIN sessions s ON s.id = l.session_id
     WHERE s.ip = $1 AND l.created_at > now() - interval '24 hours' AND l.id <> $2`,
    [session.ip, lead.id],
  );
  const fraudFlags = runFraudChecks({
    phone: lead.phone,
    email: lead.email,
    startedAt: new Date(session.started_at),
    finishedAt: new Date(session.finished_at ?? Date.now()),
    transcript: session.transcript,
    duplicateIpCount: Number(dup?.n ?? 0),
  });

  // 2. LLM-скоринг (промпт 3) с флагами как доп. контекстом
  const result = await scoreLead({
    business_context: quiz.business_context,
    ideal_lead: String(quiz.business_context.ideal_lead ?? ''),
    transcript: session.transcript,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    fraud_flags: fraudFlags,
  });

  // 3. junk не тарифицируется (billable = false) — ядро честного антифрода
  await q(
    `UPDATE leads SET score = $2, segment = $3, summary = $4, first_line = $5,
            fraud_flags = $6, billable = $7 WHERE id = $1`,
    [lead.id, result.score, result.segment, result.summary, result.first_line,
     JSON.stringify([...fraudFlags, ...result.junk_reasons]), result.segment !== 'junk'],
  );

  // 4. Уведомление в Telegram (неделя 3). Не роняем задачу, если бот недоступен —
  //    скоринг уже сохранён; ошибку логируем и идём дальше.
  try {
    await notifyLead(lead.workspace_id, lead.id, {
      quizTitle: quiz.title, name: lead.name, phone: lead.phone, email: lead.email,
      score: result.score, segment: result.segment, summary: result.summary, first_line: result.first_line,
    });
  } catch (err) {
    console.error(`Уведомление по лиду ${lead.id} не отправлено:`, err instanceof Error ? err.message : err);
  }
}

/** Шлём лид во все включённые каналы воркспейса, чей набор сегментов подходит. */
async function notifyLead(workspaceId: string, leadId: string, lead: Parameters<typeof formatLeadMessage>[0] & { segment: string | null }) {
  const channels = await q<{ type: ChannelType; config: { notify_segments?: string[] } & Record<string, unknown> }>(
    `SELECT type, config FROM integrations WHERE workspace_id = $1 AND enabled = true`,
    [workspaceId],
  );
  if (!channels.length || !lead.segment) return;

  // Защита от повторной отправки при ретрае задачи: помечаем после первой успешной.
  const already = await one<{ notified_at: string | null }>('SELECT notified_at FROM leads WHERE id = $1', [leadId]);
  if (already?.notified_at) return;

  const text = formatLeadMessage(lead);
  let sentAny = false;
  const errors: string[] = [];
  for (const ch of channels) {
    const segments = ch.config.notify_segments?.length ? ch.config.notify_segments : ['hot'];
    if (!segments.includes(lead.segment)) continue;
    try { await sendNotification(ch.type, ch.config, text); sentAny = true; }
    catch (err) { errors.push(`${ch.type}: ${err instanceof Error ? err.message : err}`); }
  }
  if (sentAny) await q('UPDATE leads SET notified_at = now() WHERE id = $1', [leadId]);
  if (errors.length) throw new Error(errors.join('; '));
}

async function processJob(job: Job) {
  try {
    if (job.type === 'score_lead') await handleScoreLead(job.payload);
    else throw new Error(`Неизвестный тип задачи: ${job.type}`);
    await q(`UPDATE jobs SET status = 'done', finished_at = now() WHERE id = $1`, [job.id]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failed = job.attempts >= MAX_ATTEMPTS;
    await q(
      `UPDATE jobs SET status = $2, error = $3,
              run_after = now() + make_interval(secs => $4),
              finished_at = CASE WHEN $2 = 'failed' THEN now() ELSE NULL END
       WHERE id = $1`,
      [job.id, failed ? 'failed' : 'pending', message, 30 * job.attempts],
    );
    console.error(`Задача ${job.id} (${job.type}) — ошибка: ${message}${failed ? ' [failed]' : ' [retry]'}`);
  }
}

async function loop() {
  console.log('Воркер запущен, опрашиваю очередь jobs…');
  for (;;) {
    try {
      const job = await claimJob();
      if (job) await processJob(job);
      else await new Promise((r) => setTimeout(r, POLL_MS));
    } catch (err) {
      console.error('Ошибка воркера:', err);
      await new Promise((r) => setTimeout(r, POLL_MS * 2));
    }
  }
}

loop();
