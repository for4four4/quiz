import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../db.js';
import { nextAdaptiveStep, personalResult } from '../services/ai.js';
import { looksLikeGibberish } from '../services/antifraud.js';

/**
 * Публичные эндпоинты для виджета (без авторизации, CORS открыт).
 * Поток: POST /start → цикл POST /answer → POST /lead → POST /result.
 */

interface QuizRow {
  id: string;
  workspace_id: string;
  status: string;
  mode: 'static' | 'adaptive';
  business_context: Record<string, unknown>;
  settings: Record<string, unknown>;
  result_template: Record<string, unknown>;
  design: Record<string, unknown>;
  title: string;
}

interface SessionRow {
  id: string;
  quiz_id: string;
  transcript: { q: string; a: unknown; generated_by: string; ts: string }[];
  goals_status: Record<string, 'closed' | 'open'>;
  started_at: string;
  status: string;
}

async function loadPublishedQuiz(quizId: string): Promise<QuizRow | null> {
  return one<QuizRow>(
    `SELECT id, workspace_id, status, mode, business_context, settings,
            result_template, design, title
     FROM quizzes WHERE id = $1 AND status = 'published'`,
    [quizId],
  );
}

/** Фолбэк на скелет вопросов: LLM недоступен/медленный или static-режим. */
async function skeletonQuestion(quizId: string, position: number) {
  const row = await one<{ title: string; type: string; options: { label: string }[] }>(
    'SELECT title, type, options FROM questions WHERE quiz_id = $1 AND position = $2',
    [quizId, position],
  );
  if (!row) return null;
  return {
    title: row.title,
    type: row.type as 'single' | 'multi' | 'text',
    options: (row.options ?? []).map((o) => o.label),
  };
}

export async function publicRoutes(app: FastifyInstance) {
  // Старт сессии: отдаём первый вопрос
  app.post('/api/w/:quizId/start', async (req, reply) => {
    const { quizId } = req.params as { quizId: string };
    const quiz = await loadPublishedQuiz(quizId);
    if (!quiz) return reply.code(404).send({ error: 'Квиз не найден или не опубликован' });

    const body = (req.body ?? {}) as { visitorId?: string; utm?: Record<string, string> };
    const [session] = await q<{ id: string }>(
      `INSERT INTO sessions(quiz_id, visitor_id, utm, ip) VALUES ($1, $2, $3, $4) RETURNING id`,
      [quiz.id, body.visitorId ?? null, JSON.stringify(body.utm ?? {}), req.ip],
    );
    await q(`INSERT INTO events(quiz_id, session_id, type) VALUES ($1, $2, 'start')`, [quiz.id, session.id]);

    const first = await skeletonQuestion(quiz.id, 0);
    return {
      sessionId: session.id,
      quiz: { title: quiz.title, design: quiz.design, settings: {
        max_questions: quiz.settings.max_questions ?? 7,
        contact_fields: quiz.settings.contact_fields ?? ['name', 'phone'],
        offer_page: quiz.settings.offer_page ?? null,
      }},
      question: first,
    };
  });

  // Ответ на вопрос → следующий шаг (адаптивный через LLM или статичный скелет)
  const answerSchema = z.object({
    sessionId: z.string().uuid(),
    question: z.string().min(1),
    answer: z.union([z.string(), z.array(z.string()), z.number()]),
  });

  app.post('/api/w/:quizId/answer', async (req, reply) => {
    const { quizId } = req.params as { quizId: string };
    const parsed = answerSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Неверный формат ответа' });
    const { sessionId, question, answer } = parsed.data;

    const quiz = await loadPublishedQuiz(quizId);
    const session = await one<SessionRow>(
      `SELECT id, quiz_id, transcript, goals_status, started_at, status
       FROM sessions WHERE id = $1 AND quiz_id = $2 AND status = 'in_progress'`,
      [sessionId, quizId],
    );
    if (!quiz || !session) return reply.code(404).send({ error: 'Сессия не найдена' });

    const transcript = [
      ...session.transcript,
      { q: question, a: answer, generated_by: quiz.mode, ts: new Date().toISOString() },
    ];
    const askedCount = transcript.length;
    const maxQuestions = Number(quiz.settings.max_questions ?? 7);

    await q(`INSERT INTO events(quiz_id, session_id, type, payload) VALUES ($1, $2, 'answer', $3)`,
      [quiz.id, session.id, JSON.stringify({ step: askedCount })]);

    // Статичный режим: просто следующий вопрос по позиции
    if (quiz.mode === 'static') {
      const next = await skeletonQuestion(quiz.id, askedCount);
      await q('UPDATE sessions SET transcript = $2 WHERE id = $1',
        [session.id, JSON.stringify(transcript)]);
      return next && askedCount < maxQuestions
        ? { action: 'ask', question: next }
        : { action: 'finish' };
    }

    // Адаптивный режим: промпт 2 (Haiku) с фолбэком на скелет по таймауту 4с
    const goals = (quiz.business_context.qualification_goals as string[]) ?? [];
    let step: Awaited<ReturnType<typeof nextAdaptiveStep>>;
    try {
      step = await Promise.race([
        nextAdaptiveStep({
          business_context: quiz.business_context,
          qualification_goals: goals,
          transcript,
          asked_count: askedCount,
          max_questions: maxQuestions,
        }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('llm_timeout')), 4000)),
      ]);
    } catch {
      const fallback = await skeletonQuestion(quiz.id, askedCount);
      step = {
        action: fallback && askedCount < maxQuestions ? 'ask' : 'finish',
        question: fallback,
        flag: typeof answer === 'string' && looksLikeGibberish(answer) ? 'gibberish' : null,
        goals_status: session.goals_status,
      };
    }

    // goals_status сохраняем в сессию — модель «не забывает» прогресс между вызовами
    await q('UPDATE sessions SET transcript = $2, goals_status = $3 WHERE id = $1',
      [session.id, JSON.stringify(transcript), JSON.stringify(step.goals_status ?? {})]);

    if (step.action === 'finish' || askedCount >= maxQuestions) {
      return { action: 'finish' };
    }
    return { action: 'ask', question: step.question };
  });

  // Отправка контактов → лид + фоновая задача скоринга
  const leadSchema = z.object({
    sessionId: z.string().uuid(),
    name: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
    email: z.string().max(200).optional(),
    consent: z.literal(true, { errorMap: () => ({ message: 'Нужно согласие на обработку ПД' }) }),
  });

  app.post('/api/w/:quizId/lead', async (req, reply) => {
    const { quizId } = req.params as { quizId: string };
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });
    const { sessionId, name, phone, email } = parsed.data;
    if (!phone && !email) return reply.code(400).send({ error: 'Укажите телефон или email' });

    const quiz = await loadPublishedQuiz(quizId);
    const session = await one<SessionRow>(
      `SELECT id, quiz_id, transcript, goals_status, started_at, status
       FROM sessions WHERE id = $1 AND quiz_id = $2`,
      [sessionId, quizId],
    );
    if (!quiz || !session) return reply.code(404).send({ error: 'Сессия не найдена' });

    await q(`UPDATE sessions SET status = 'completed', finished_at = now() WHERE id = $1`, [session.id]);

    const [lead] = await q<{ id: string }>(
      `INSERT INTO leads(session_id, quiz_id, workspace_id, name, phone, email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [session.id, quiz.id, quiz.workspace_id, name ?? null, phone ?? null, email ?? null],
    );
    await q(`INSERT INTO events(quiz_id, session_id, type) VALUES ($1, $2, 'lead')`, [quiz.id, session.id]);

    // Антифрод + промпт 3 — асинхронно в воркере, чтобы не задерживать посетителя
    await q(`INSERT INTO jobs(type, payload) VALUES ('score_lead', $1)`,
      [JSON.stringify({ leadId: lead.id })]);

    return { leadId: lead.id };
  });

  // Персональный результат (промпт 4) — показывается после формы контактов
  app.post('/api/w/:quizId/result', async (req, reply) => {
    const { quizId } = req.params as { quizId: string };
    const { sessionId } = (req.body ?? {}) as { sessionId?: string };
    if (!sessionId) return reply.code(400).send({ error: 'Нет sessionId' });

    const quiz = await loadPublishedQuiz(quizId);
    const session = await one<SessionRow>(
      'SELECT id, quiz_id, transcript, goals_status, started_at, status FROM sessions WHERE id = $1 AND quiz_id = $2',
      [sessionId, quizId],
    );
    if (!quiz || !session) return reply.code(404).send({ error: 'Сессия не найдена' });

    try {
      const result = await personalResult({
        business_context: quiz.business_context,
        transcript: session.transcript,
        result_template: quiz.result_template,
        cta_text: String(quiz.settings.cta_text ?? 'Получить расчёт'),
      });
      return result;
    } catch {
      // Фолбэк: нейтральный экран «спасибо», чтобы посетитель не увидел ошибку
      return {
        headline: 'Спасибо! Мы уже работаем над вашим запросом',
        body: 'Мы получили ваши ответы и свяжемся с вами в ближайшее время с персональным предложением.',
      };
    }
  });
}
