import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { one, q } from '../db.js';

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Пароль — минимум 8 символов'),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (req, reply) => {
    const parsed = credsSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0].message });
    const { email, password } = parsed.data;

    const exists = await one('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists) return reply.code(409).send({ error: 'Пользователь с таким email уже есть' });

    const hash = await bcrypt.hash(password, 10);
    const [user] = await q<{ id: string }>(
      'INSERT INTO users(email, password_hash) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase(), hash],
    );
    const [ws] = await q<{ id: string }>(
      'INSERT INTO workspaces(owner_user_id) VALUES ($1) RETURNING id',
      [user.id],
    );

    const token = app.jwt.sign({ userId: user.id, workspaceId: ws.id });
    return { token, workspaceId: ws.id };
  });

  app.post('/api/auth/login', async (req, reply) => {
    const parsed = credsSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Неверный формат данных' });
    const { email, password } = parsed.data;

    const user = await one<{ id: string; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()],
    );
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.code(401).send({ error: 'Неверный email или пароль' });
    }

    const ws = await one<{ id: string }>(
      'SELECT id FROM workspaces WHERE owner_user_id = $1 ORDER BY created_at LIMIT 1',
      [user.id],
    );
    const token = app.jwt.sign({ userId: user.id, workspaceId: ws!.id });
    return { token, workspaceId: ws!.id };
  });
}
