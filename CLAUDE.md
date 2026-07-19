# Квалифай (qvalify.ru) — заметки для Claude

Платформа квизов с ИИ-генерацией, аналитикой и встроенной CRM.

## Что это за проект

Полностью новая версия, начатая с нуля по дизайн-хэндоффу Claude Design
(9 экранов: лендинг, тарифы, примеры, новости, отзывы, документы, кабинет клиента,
редактор квиза, админ-панель). Прежний код (Fastify API + Vite admin + Preact widget)
удалён по договорённости с владельцем.

## Стек

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — токены и анимации в `app/globals.css`
- Все стили секций лендинга — инлайн-стили, точно повторяющие прототип
- Бэкенд — Route Handlers (`app/api/*`) + PostgreSQL (`pg`) + Polza.ai (`openai` SDK)

## Бэкенд

- Серверная логика — в `lib/server/*` (db, auth, llm, prompts, scoring, integrations, env)
- Схема БД — `db/schema.sql`, применяется идемпотентно через `ensureSchema()`
- API: `/api/auth`, `/api/ai/generate`, `/api/quizzes[/id]`,
  `/api/public/quiz/[slug]`, `/api/public/lead`
- Публичный рантайм квиза — страница `/q/[slug]` (`components/quiz/QuizRuntime.tsx`)
  и встраиваемый виджет `public/embed.js`
- Слаги квизов — только ASCII (транслит кириллицы в `slugify`, `app/api/quizzes/route.ts`)
- Route Handlers с `pg`/`jsonwebtoken` требуют `runtime = "nodejs"`
- Ключи и БД — только через `.env` (см. `.env.example`), в репозиторий не коммитятся

## Команды

```bash
npm run dev      # разработка
npm run build    # сборка (обязательно проверять перед коммитом)
npm start        # прод-запуск

docker compose up -d --build   # весь стек (Postgres + сайт) в один запуск
```

Docker: `Dockerfile` (multi-stage, `output: "standalone"`) + `docker-compose.yml`
(поднимает postgres и приложение, схема применяется через `ensureSchema`).

## Соглашения

- Маршруты и ссылки навигации централизованы в `lib/nav.ts`
- Общие блоки — `components/site/` (Nav, Footer, Logo, primitives, Container)
- Клиентские компоненты (`"use client"`) — только там, где нужен браузерный API
  (`components/util/Reveal.tsx`, `components/util/MoscowClock.tsx`)
- Иконки — инлайн-SVG; логотипы интеграций — `public/uploads/*.svg`

## Дизайн-токены

Фон `#E8EDF6` · тёмная секция `#0F1F3C` · акцент `#28559c` (hover `#1e437d`) ·
текст `#111827` · приглушённый `#4b5563 / #6b7280 / #9ca3af` · линии `#e5e7eb / #f0f0f0` ·
успех `#166534`. Карточки — радиус `20px`, пилюли — `9999px`.

## Будущий бэкенд — переменные окружения

Ключи хранятся вне репозитория (`.env` в `.gitignore`). Для нового API понадобятся:

```
PORT=8080
JWT_SECRET=...
PUBLIC_ORIGIN=https://qvalify.ru
UPLOAD_DIR=/var/www/quiz/uploads
DATABASE_URL=postgres://kvalify:kvalify@localhost:5432/kvalify

# Polza.ai — OpenAI-совместимый агрегатор нейросетей (доступ к моделям)
POLZA_API_KEY=sk-...
POLZA_BASE_URL=https://polza.ai/api/v1
LLM_MODEL_FAST=anthropic/claude-haiku-4.5
LLM_MODEL_SMART=anthropic/claude-sonnet-4.6

# Интеграции: Telegram / VK / MAX — токены добавляются по мере реализации
```
