import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { quizRoutes } from './routes/quizzes.js';
import { publicRoutes } from './routes/public.js';
import { integrationRoutes } from './routes/integrations.js';
import { uploadRoutes } from './routes/uploads.js';
import { galleryRoutes } from './routes/gallery.js';

const app = Fastify({ logger: true, trustProxy: true });

// Публичный API виджета живёт на чужих сайтах → CORS открыт.
// Админские роуты защищены JWT, поэтому открытый CORS для них не опасен,
// но при желании можно сузить origin до домена админки.
await app.register(cors, { origin: true });
await app.register(jwt, { secret: config.jwtSecret });
await app.register(multipart);

// Раздача загруженных картинок на /uploads/* (в проде можно отдать nginx).
const uploadRoot = resolve(config.uploadDir);
mkdirSync(uploadRoot, { recursive: true });
await app.register(fastifyStatic, { root: uploadRoot, prefix: '/uploads/', decorateReply: false });

app.get('/api/health', async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(quizRoutes);
await app.register(integrationRoutes);
await app.register(uploadRoutes);
await app.register(galleryRoutes);
await app.register(publicRoutes);

app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => console.log(`API на порту ${config.port}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
