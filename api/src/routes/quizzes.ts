import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { one, q, pool } from '../db.js';
import { generateQuiz } from '../services/ai.js';

interface JwtPayload { userId: string; workspaceId: string }

function ws(req: FastifyRequest): string {
  return (req.user as JwtPayload).workspaceId;
}

const briefSchema = z.object({
  business_description: z.string().min(20, 'Опишите бизнес подробнее (минимум 20 символов)'),
  goal: z.string().min(3),
  geo: z.string().default('Россия'),
  ideal_lead: z.string().min(3),
});

export async function quizRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req, reply) => {
    try { await req.jwtVerify(); } catch { reply.code(401).send({ error: 'Нужна авторизация' }); }
  });

  // Онбординг: «Создать квиз с ИИ» — промпт 1 (Sonnet), первый вау-момент
  app.post('/api/quizzes/generate', async (req, reply) => {
    const parsed = briefSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });
    const brief = parsed.data;

    const generated = await generateQuiz(brief);

    const businessContext = { ...brief, qualification_goals: generated.qualification_goals };
    const settings = {
      max_questions: Math.max(generated.questions.length, 7),
      contact_fields: ['name', 'phone'],
      offer_page: generated.offer_page,
      cta_text: 'Получить расчёт',
    };

    const [quiz] = await q<{ id: string }>(
      `INSERT INTO quizzes(workspace_id, title, mode, business_context, settings)
       VALUES ($1, $2, 'adaptive', $3, $4) RETURNING id`,
      [ws(req), generated.quiz_title, businessContext, settings],
    );

    // Сохраняем сгенерированные вопросы как «скелет» (для static-режима и фолбэка)
    for (let i = 0; i < generated.questions.length; i++) {
      const question = generated.questions[i];
      await q(
        `INSERT INTO questions(quiz_id, position, type, title, options, branch_rules)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quiz.id, i, question.type, question.title,
         JSON.stringify(question.options.map((o) => ({ label: o }))),
         JSON.stringify({ why: question.why })],
      );
    }

    return { quizId: quiz.id, generated };
  });

  app.get('/api/quizzes', async (req) => {
    return q(
      `SELECT id, title, slug, status, mode, created_at, updated_at
       FROM quizzes WHERE workspace_id = $1 ORDER BY updated_at DESC`,
      [ws(req)],
    );
  });

  app.get('/api/quizzes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const quiz = await one(
      'SELECT * FROM quizzes WHERE id = $1 AND workspace_id = $2',
      [id, ws(req)],
    );
    if (!quiz) return reply.code(404).send({ error: 'Квиз не найден' });
    const questions = await q(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY position',
      [id],
    );
    return { ...quiz, questions };
  });

  const patchSchema = z.object({
    title: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    mode: z.enum(['static', 'adaptive']).optional(),
    business_context: z.record(z.unknown()).optional(),
    design: z.record(z.unknown()).optional(),
    settings: z.record(z.unknown()).optional(),
    result_template: z.record(z.unknown()).optional(),
    slug: z.string().regex(/^[a-z0-9-]{3,60}$/, 'Слаг: латиница, цифры, дефис').optional(),
  });

  app.patch('/api/quizzes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });

    const fields = Object.entries(parsed.data);
    if (fields.length === 0) return reply.code(400).send({ error: 'Нет полей для обновления' });

    const sets = fields.map(([k], i) => `${k} = $${i + 3}`).join(', ');
    const updated = await one(
      `UPDATE quizzes SET ${sets}, updated_at = now()
       WHERE id = $1 AND workspace_id = $2 RETURNING id, title, status, mode, slug`,
      [id, ws(req), ...fields.map(([, v]) => (typeof v === 'object' ? JSON.stringify(v) : v))],
    );
    if (!updated) return reply.code(404).send({ error: 'Квиз не найден' });
    return updated;
  });

  // Полная замена вопросов-скелета (редактор + drag&drop). Позиции — по порядку массива.
  const questionsSchema = z.object({
    questions: z.array(z.object({
      type: z.enum(['single', 'multi', 'image', 'slider', 'text', 'date']),
      title: z.string().min(1, 'Вопрос не может быть пустым').max(300),
      options: z.array(z.object({
        label: z.string().max(200),
        img: z.string().max(600).optional(),
      })).max(8).default([]),
      required: z.boolean().default(true),
      branch_rules: z.record(z.unknown()).default({}),
    })).max(15),
  });

  app.put('/api/quizzes/:id/questions', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = questionsSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });

    const owns = await one('SELECT id FROM quizzes WHERE id = $1 AND workspace_id = $2', [id, ws(req)]);
    if (!owns) return reply.code(404).send({ error: 'Квиз не найден' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM questions WHERE quiz_id = $1', [id]);
      const qs = parsed.data.questions;
      for (let i = 0; i < qs.length; i++) {
        const question = qs[i];
        await client.query(
          `INSERT INTO questions(quiz_id, position, type, title, options, required, branch_rules)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, i, question.type, question.title, JSON.stringify(question.options),
           question.required, JSON.stringify(question.branch_rules)],
        );
      }
      await client.query('UPDATE quizzes SET updated_at = now() WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const questions = await q('SELECT * FROM questions WHERE quiz_id = $1 ORDER BY position', [id]);
    return { questions };
  });

  // Лиды воркспейса: junk по умолчанию скрыт (фильтр честности антифрода)
  app.get('/api/leads', async (req) => {
    const { quizId, includeJunk } = req.query as { quizId?: string; includeJunk?: string };
    const params: unknown[] = [ws(req)];
    let where = 'workspace_id = $1';
    if (quizId) { params.push(quizId); where += ` AND quiz_id = $${params.length}`; }
    if (includeJunk !== 'true') where += ` AND (segment IS DISTINCT FROM 'junk')`;
    return q(
      `SELECT id, quiz_id, name, phone, email, score, segment, summary, first_line,
              fraud_flags, billable, created_at
       FROM leads WHERE ${where} ORDER BY created_at DESC LIMIT 200`,
      params,
    );
  });

  app.get('/api/leads/:id/transcript', async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await one<{ transcript: unknown }>(
      `SELECT s.transcript FROM leads l JOIN sessions s ON s.id = l.session_id
       WHERE l.id = $1 AND l.workspace_id = $2`,
      [id, ws(req)],
    );
    if (!row) return reply.code(404).send({ error: 'Лид не найден' });
    return row;
  });

  // Убедиться, что квиз принадлежит воркспейсу (для аналитики)
  async function ownQuiz(req: FastifyRequest, id: string) {
    return one<{ id: string; title: string; business_context: Record<string, unknown> }>(
      'SELECT id, title, business_context FROM quizzes WHERE id = $1 AND workspace_id = $2', [id, ws(req)]);
  }

  // Воронка по вопросам из таблицы events + конверсия, средний скоринг, топ UTM
  app.get('/api/quizzes/:id/analytics', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { days } = req.query as { days?: string };
    const quiz = await ownQuiz(req, id);
    if (!quiz) return reply.code(404).send({ error: 'Квиз не найден' });
    const window = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = `now() - make_interval(days => ${window})`;

    // Итоги по типам событий
    const totals = await q<{ type: string; n: string }>(
      `SELECT type, count(*) AS n FROM events WHERE quiz_id = $1 AND ts > ${since} GROUP BY type`, [id]);
    const totalOf = (t: string) => Number(totals.find((r) => r.type === t)?.n ?? 0);
    const views = totalOf('view'), starts = totalOf('start'), leads = totalOf('lead');

    // Ответы по шагам (payload.step = порядковый номер отвеченного вопроса)
    const steps = await q<{ step: number; n: string }>(
      `SELECT (payload->>'step')::int AS step, count(*) AS n
       FROM events WHERE quiz_id = $1 AND type = 'answer' AND ts > ${since}
       GROUP BY 1 ORDER BY 1`, [id]);

    // Названия вопросов-скелета для подписи шагов
    const questions = await q<{ position: number; title: string }>(
      'SELECT position, title FROM questions WHERE quiz_id = $1 ORDER BY position', [id]);
    const titleAt = (pos: number) => questions.find((x) => x.position === pos)?.title ?? `Шаг ${pos + 1}`;

    // Воронка: Просмотры → Старт → каждый шаг → Заявка
    const funnel: { label: string; count: number }[] = [
      { label: 'Просмотры', count: views },
      { label: 'Начали квиз', count: starts },
    ];
    const maxStep = steps.reduce((m, s) => Math.max(m, s.step), 0);
    for (let st = 1; st <= maxStep; st++) {
      const n = Number(steps.find((s) => s.step === st)?.n ?? 0);
      funnel.push({ label: titleAt(st - 1), count: n });
    }
    funnel.push({ label: 'Оставили заявку', count: leads });
    // drop_rate относительно предыдущего шага
    const funnelWithDrop = funnel.map((f, i) => ({
      ...f,
      drop_rate: i === 0 || funnel[i - 1].count === 0 ? 0
        : Math.round((1 - f.count / funnel[i - 1].count) * 100),
    }));

    const scoreRow = await one<{ avg: string | null; hot: string; total: string }>(
      `SELECT round(avg(score))::text AS avg,
              count(*) FILTER (WHERE segment = 'hot') AS hot,
              count(*) FILTER (WHERE billable) AS total
       FROM leads WHERE quiz_id = $1 AND created_at > ${since}`, [id]);

    const utm = await q<{ source: string; n: string; leads: string }>(
      `SELECT COALESCE(NULLIF(s.utm->>'utm_source', ''), 'прямой заход') AS source,
              count(*) AS n,
              count(*) FILTER (WHERE l.id IS NOT NULL) AS leads
       FROM sessions s LEFT JOIN leads l ON l.session_id = s.id
       WHERE s.quiz_id = $1 AND s.started_at > ${since}
       GROUP BY 1 ORDER BY 2 DESC LIMIT 5`, [id]);

    return {
      window_days: window,
      totals: { views, starts, leads },
      conversion: starts ? Math.round((leads / starts) * 100) : 0,
      view_to_lead: views ? Math.round((leads / views) * 100) : 0,
      avg_score: scoreRow?.avg ? Number(scoreRow.avg) : null,
      hot_leads: Number(scoreRow?.hot ?? 0),
      funnel: funnelWithDrop,
      top_utm: utm.map((u) => ({ source: u.source, sessions: Number(u.n), leads: Number(u.leads) })),
    };
  });

  // ИИ-аналитик воронки (промпт 5) — по кнопке
  app.post('/api/quizzes/:id/analyze', async (req, reply) => {
    const { id } = req.params as { id: string };
    const quiz = await ownQuiz(req, id);
    if (!quiz) return reply.code(404).send({ error: 'Квиз не найден' });

    // Свежая статистика воронки для передачи модели
    const analytics = await app.inject({
      method: 'GET', url: `/api/quizzes/${id}/analytics`,
      headers: { authorization: req.headers.authorization ?? '' },
    }).then((r) => r.json());

    const questions = await q<{ title: string; branch_rules: { why?: string } }>(
      'SELECT title, branch_rules FROM questions WHERE quiz_id = $1 ORDER BY position', [id]);
    const samples = await q<{ transcript: unknown }>(
      `SELECT s.transcript FROM sessions s
       WHERE s.quiz_id = $1 AND jsonb_array_length(s.transcript) > 0
       ORDER BY s.started_at DESC LIMIT 10`, [id]);

    const { analyzeFunnel } = await import('../services/ai.js');
    const analysis = await analyzeFunnel({
      quiz_snapshot: {
        title: quiz.title,
        qualification_goals: quiz.business_context.qualification_goals ?? [],
        questions: questions.map((x) => ({ title: x.title, why: x.branch_rules?.why })),
      },
      funnel_stats: {
        funnel: analytics.funnel, conversion: analytics.conversion,
        avg_score: analytics.avg_score, top_utm: analytics.top_utm,
      },
      sample_transcripts: samples.map((s) => s.transcript),
    });
    return analysis;
  });
}
