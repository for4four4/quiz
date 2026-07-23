-- Квалифай — схема БД (PostgreSQL)
-- Применяется автоматически при старте (lib/server/db.ts → ensureSchema),
-- либо вручную: psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  password    TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',   -- free | start | pro | biz
  lead_limit  INTEGER NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',  -- draft | active
  steps       JSONB NOT NULL DEFAULT '[]',    -- шаги/блоки квиза
  design      JSONB NOT NULL DEFAULT '{}',    -- кнопка/показ/тема
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);

CREATE TABLE IF NOT EXISTS leads (
  id          BIGSERIAL PRIMARY KEY,
  quiz_id     BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  answers     JSONB NOT NULL DEFAULT '[]',
  source      TEXT NOT NULL DEFAULT '',       -- встроенный блок | плавающая кнопка | прямая ссылка
  score       INTEGER NOT NULL DEFAULT 0,     -- 0..100
  heat        TEXT NOT NULL DEFAULT 'cold',   -- hot | warm | cold
  summary     TEXT NOT NULL DEFAULT '',       -- обобщение ИИ
  status      TEXT NOT NULL DEFAULT 'new',    -- new | work | done | rejected
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_quiz ON leads(quiz_id);

CREATE TABLE IF NOT EXISTS integrations (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,                  -- telegram | vk | max | webhook | amocrm | bitrix24 | metrika | calltracking
  config      JSONB NOT NULL DEFAULT '{}',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

-- Идемпотентные миграции (добавление колонок к существующим таблицам)
ALTER TABLE leads   ADD COLUMN IF NOT EXISTS ip   TEXT NOT NULL DEFAULT '';
ALTER TABLE leads   ADD COLUMN IF NOT EXISTS utm  JSONB NOT NULL DEFAULT '{}';  -- скрытые поля: utm_*, referrer
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS domain TEXT;                        -- свой домен квиза (CNAME)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_domain ON quizzes(domain) WHERE domain IS NOT NULL AND domain <> '';
ALTER TABLE users   ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'; -- защита: dedupeHours, ipBlacklist[]
ALTER TABLE users   ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';    -- user | admin (доступ к /admin)
ALTER TABLE users   ADD COLUMN IF NOT EXISTS valid_until DATE;                      -- срок действия тарифа

-- События посетителей для воронки и аналитики шагов
CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  quiz_id     BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                  -- open | step | contact | lead
  step        INTEGER,                        -- индекс вопроса для type=step
  source      TEXT NOT NULL DEFAULT '',       -- встроенный блок | плавающая кнопка | прямая ссылка
  session     TEXT NOT NULL DEFAULT '',       -- анонимный id сессии посетителя
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_quiz ON events(quiz_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(quiz_id, type);
