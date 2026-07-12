import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { one, q } from '../db.js';
import { formatLeadMessage, sendTelegramMessage } from '../services/telegram.js';

interface JwtPayload { userId: string; workspaceId: string }
function ws(req: FastifyRequest): string {
  return (req.user as JwtPayload).workspaceId;
}

const telegramSchema = z.object({
  bot_token: z.string().min(10, 'Проверьте токен бота'),
  chat_id: z.string().min(1, 'Укажите chat_id'),
  notify_segments: z.array(z.enum(['hot', 'warm', 'cold', 'junk'])).min(1).default(['hot']),
  enabled: z.boolean().default(true),
});

export async function integrationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (req, reply) => {
    try { await req.jwtVerify(); } catch { reply.code(401).send({ error: 'Нужна авторизация' }); }
  });

  // Список интеграций воркспейса (токен наружу не отдаём — только факт настройки)
  app.get('/api/integrations', async (req) => {
    const rows = await q<{ type: string; config: Record<string, unknown>; enabled: boolean }>(
      'SELECT type, config, enabled FROM integrations WHERE workspace_id = $1', [ws(req)]);
    return rows.map((r) => ({
      type: r.type,
      enabled: r.enabled,
      config: r.type === 'telegram'
        ? { chat_id: r.config.chat_id ?? '', notify_segments: r.config.notify_segments ?? ['hot'], has_token: !!r.config.bot_token }
        : r.config,
    }));
  });

  // Upsert Telegram-интеграции. Токен можно не присылать при повторном сохранении —
  // тогда оставляем уже сохранённый (чтобы не светить его в форме).
  app.put('/api/integrations/telegram', async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const existing = await one<{ config: { bot_token?: string } }>(
      `SELECT config FROM integrations WHERE workspace_id = $1 AND type = 'telegram'`, [ws(req)]);
    if (!body.bot_token && existing?.config?.bot_token) body.bot_token = existing.config.bot_token;

    const parsed = telegramSchema.safeParse(body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });
    const { enabled, ...config } = parsed.data;

    await q(
      `INSERT INTO integrations(workspace_id, type, config, enabled)
       VALUES ($1, 'telegram', $2, $3)
       ON CONFLICT (workspace_id, type)
       DO UPDATE SET config = $2, enabled = $3, updated_at = now()`,
      [ws(req), JSON.stringify(config), enabled],
    );
    return { ok: true };
  });

  app.delete('/api/integrations/telegram', async (req) => {
    await q(`DELETE FROM integrations WHERE workspace_id = $1 AND type = 'telegram'`, [ws(req)]);
    return { ok: true };
  });

  // Тестовое сообщение: проверить токен и chat_id прямо из формы
  app.post('/api/integrations/telegram/test', async (req, reply) => {
    const body = (req.body ?? {}) as { bot_token?: string; chat_id?: string };
    let token = body.bot_token, chat = body.chat_id;
    if (!token) {
      const existing = await one<{ config: { bot_token?: string; chat_id?: string } }>(
        `SELECT config FROM integrations WHERE workspace_id = $1 AND type = 'telegram'`, [ws(req)]);
      token = token || existing?.config?.bot_token;
      chat = chat || existing?.config?.chat_id;
    }
    if (!token || !chat) return reply.code(400).send({ error: 'Укажите токен бота и chat_id' });

    try {
      const preview = formatLeadMessage({
        quizTitle: 'Тестовый квиз', name: 'Иван Пример', phone: '+7 (900) 000-00-00', email: null,
        score: 92, segment: 'hot', summary: 'Проверка связи: так будет выглядеть уведомление о горячем лиде.',
        first_line: 'Иван, добрый день! Вы оставили заявку — удобно обсудить сейчас?',
      });
      await sendTelegramMessage({ bot_token: token, chat_id: chat }, '✅ <b>Квалифай подключён</b>\n\n' + preview);
      return { ok: true };
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : 'Не удалось отправить сообщение' });
    }
  });
}
