import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { one, q } from '../db.js';
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
}
