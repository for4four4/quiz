import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { quizRoutes } from './routes/quizzes.js';
import { publicRoutes } from './routes/public.js';

const app = Fastify({ logger: true, trustProxy: true });

// Публичный API виджета живёт на чужих сайтах → CORS открыт.
// Админские роуты защищены JWT, поэтому открытый CORS для них не опасен,
// но при желании можно сузить origin до домена админки.
await app.register(cors, { origin: true });
await app.register(jwt, { secret: config.jwtSecret });

app.get('/api/health', async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(quizRoutes);
await app.register(publicRoutes);

app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => console.log(`API на порту ${config.port}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
