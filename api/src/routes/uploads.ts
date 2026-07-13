import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.js';

/**
 * Загрузка картинок (варианты «выбор с картинками», фото для обложки).
 * Файлы сохраняются в config.uploadDir и раздаются статикой на /uploads/*.
 * В проде за раздачу можно посадить nginx (см. README), но и через API работает.
 */
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 МБ

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/uploads', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.code(401).send({ error: 'Нужна авторизация' }); }

    const file = await req.file({ limits: { fileSize: MAX_BYTES } });
    if (!file) return reply.code(400).send({ error: 'Файл не получен' });

    const ext = ALLOWED[file.mimetype];
    if (!ext) return reply.code(415).send({ error: 'Только изображения: JPG, PNG, WEBP, GIF' });

    const buf = await file.toBuffer().catch(() => null);
    if (!buf) return reply.code(400).send({ error: 'Не удалось прочитать файл' });
    if (file.file.truncated || buf.length > MAX_BYTES) {
      return reply.code(413).send({ error: 'Файл больше 5 МБ' });
    }

    const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}${ext}`;
    await mkdir(config.uploadDir, { recursive: true });
    await writeFile(join(config.uploadDir, name), buf);

    const url = `${config.publicOrigin.replace(/\/$/, '')}/uploads/${name}`;
    return { url, path: `/uploads/${name}` };
  });

}
