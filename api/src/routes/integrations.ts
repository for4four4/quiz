import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { one, q } from '../db.js';
import { formatLeadMessage, sendNotification, type ChannelType } from '../services/notify.js';

interface JwtPayload { userId: string; workspaceId: string }
function ws(req: FastifyRequest): string {
  return (req.user as JwtPayload).workspaceId;
}

const segments = z.array(z.enum(['hot', 'warm', 'cold', 'junk'])).min(1).default(['hot']);

/**
 * Описание каналов: секретное поле (наружу не отдаётся), поле-адресат и схема.
 * Одна интеграция каждого типа на воркспейс (upsert по workspace_id + type).
 */
const CHANNELS: Record<ChannelType, { secret: string; schema: z.ZodType<Record<string, unknown>> }> = {
  telegram: {
    secret: 'bot_token',
    schema: z.object({ bot_token: z.string().min(10, 'Проверьте токен бота'), chat_id: z.string().min(1, 'Укажите chat_id'), notify_segments: segments }),
  },
  vk: {
    secret: 'access_token',
    schema: z.object({ access_token: z.string().min(10, 'Проверьте токен сообщества'), peer_id: z.string().min(1, 'Укажите peer_id'), notify_segments: segments }),
  },
  max: {
    secret: 'access_token',
    schema: z.object({ access_token: z.string().min(10, 'Проверьте токен бота'), chat_id: z.string().min(1, 'Укажите chat_id'), notify_segments: segments }),
  },
};

function isChannel(t: string): t is ChannelType {
  return t === 'telegram' || t === 'vk' || t === 'max';
}

export async function integrationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req, reply) => {
    try { await req.jwtVerify(); } catch { reply.code(401).send({ error: 'Нужна авторизация' }); }
  });

  // Список интеграций воркспейса. Секрет наружу не отдаём — только флаг has_secret.
  app.get('/api/integrations', async (req) => {
    const rows = await q<{ type: string; config: Record<string, unknown>; enabled: boolean }>(
      'SELECT type, config, enabled FROM integrations WHERE workspace_id = $1', [ws(req)]);
    return rows.map((r) => {
      const secret = isChannel(r.type) ? CHANNELS[r.type].secret : null;
      const config = { ...r.config };
      let has_secret = false;
      if (secret) { has_secret = !!config[secret]; delete config[secret]; }
      return { type: r.type, enabled: r.enabled, config: { ...config, has_secret } };
    });
  });

  // Upsert канала. Секрет можно не присылать при повторном сохранении — берём прежний.
  app.put('/api/integrations/:type', async (req, reply) => {
    const { type } = req.params as { type: string };
    if (!isChannel(type)) return reply.code(404).send({ error: 'Неизвестный тип интеграции' });
    const { secret, schema } = CHANNELS[type];

    const body = (req.body ?? {}) as Record<string, unknown> & { enabled?: boolean };
    const existing = await one<{ config: Record<string, unknown> }>(
      `SELECT config FROM integrations WHERE workspace_id = $1 AND type = $2`, [ws(req), type]);
    if (!body[secret] && existing?.config?.[secret]) body[secret] = existing.config[secret];

    const parsed = schema.safeParse(body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });
    const enabled = body.enabled !== false;

    await q(
      `INSERT INTO integrations(workspace_id, type, config, enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (workspace_id, type)
       DO UPDATE SET config = $3, enabled = $4, updated_at = now()`,
      [ws(req), type, JSON.stringify(parsed.data), enabled],
    );
    return { ok: true };
  });

  app.delete('/api/integrations/:type', async (req, reply) => {
    const { type } = req.params as { type: string };
    if (!isChannel(type)) return reply.code(404).send({ error: 'Неизвестный тип интеграции' });
    await q(`DELETE FROM integrations WHERE workspace_id = $1 AND type = $2`, [ws(req), type]);
    return { ok: true };
  });

  // Тестовое сообщение: проверить настройки прямо из формы.
  app.post('/api/integrations/:type/test', async (req, reply) => {
    const { type } = req.params as { type: string };
    if (!isChannel(type)) return reply.code(404).send({ error: 'Неизвестный тип интеграции' });
    const { secret, schema } = CHANNELS[type];

    const body = (req.body ?? {}) as Record<string, unknown>;
    const existing = await one<{ config: Record<string, unknown> }>(
      `SELECT config FROM integrations WHERE workspace_id = $1 AND type = $2`, [ws(req), type]);
    if (!body[secret] && existing?.config?.[secret]) body[secret] = existing.config[secret];
    if (!body.notify_segments) body.notify_segments = ['hot'];

    const parsed = schema.safeParse(body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });

    const preview = formatLeadMessage({
      quizTitle: 'Тестовый квиз', name: 'Иван Пример', phone: '+7 (900) 000-00-00', email: null,
      score: 92, segment: 'hot', summary: 'Проверка связи: так будет выглядеть уведомление о горячем лиде.',
      first_line: 'Иван, добрый день! Вы оставили заявку — удобно обсудить сейчас?',
    });
    try {
      await sendNotification(type, parsed.data, '✅ Квалифай подключён\n\n' + preview);
      return { ok: true };
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : 'Не удалось отправить сообщение' });
    }
  });
}
