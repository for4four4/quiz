# syntax=docker/dockerfile:1

# ─── 1. Установка зависимостей ──────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─── 2. Сборка приложения ───────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── 3. Продакшн-образ (минимальный, standalone) ────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Непривилегированный пользователь
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone-сервер Next.js + статика + публичные файлы
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Схема БД нужна в рантайме: ensureSchema() читает db/schema.sql
COPY --from=builder /app/db ./db

USER nextjs
EXPOSE 3000

# server.js генерируется next build при output:"standalone"
CMD ["node", "server.js"]
