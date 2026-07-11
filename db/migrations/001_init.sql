-- 001_init.sql — базовая схема «Квалифай» (MVP)

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- Аккаунты и биллинг -----------------------------------------------------

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES users(id),
  name            TEXT NOT NULL DEFAULT 'Мой проект',
  plan            TEXT NOT NULL DEFAULT 'free',          -- free | start | pro | agency
  plan_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id),
  provider       TEXT NOT NULL DEFAULT 'yookassa',
  status         TEXT NOT NULL,                          -- active | past_due | canceled
  next_charge_at TIMESTAMPTZ,
  amount         NUMERIC(10,2)
);

-- Квизы -------------------------------------------------------------------

CREATE TABLE quizzes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id),
  title            TEXT NOT NULL DEFAULT 'Новый квиз',
  slug             TEXT UNIQUE,                          -- для quiz.домен/slug
  status           TEXT NOT NULL DEFAULT 'draft',        -- draft | published | archived
  mode             TEXT NOT NULL DEFAULT 'static',       -- static | adaptive
  business_context JSONB NOT NULL DEFAULT '{}',          -- бриф: бизнес, цель, гео, ideal_lead, qualification_goals
  design           JSONB NOT NULL DEFAULT '{}',
  settings         JSONB NOT NULL DEFAULT '{}',          -- max_questions, contact_fields, bonus, redirect, cta_text
  result_template  JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_workspace_idx ON quizzes(workspace_id);

CREATE TABLE questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position     INT NOT NULL,
  type         TEXT NOT NULL,                            -- single | multi | image | slider | text | date
  title        TEXT NOT NULL,
  options      JSONB NOT NULL DEFAULT '[]',
  required     BOOLEAN NOT NULL DEFAULT true,
  branch_rules JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX questions_quiz_idx ON questions(quiz_id, position);

-- Прохождения ---------------------------------------------------------------

CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     UUID NOT NULL REFERENCES quizzes(id),
  visitor_id  TEXT,
  utm         JSONB NOT NULL DEFAULT '{}',
  ip          INET,
  fingerprint TEXT,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'in_progress',       -- in_progress | completed | abandoned
  transcript  JSONB NOT NULL DEFAULT '[]',               -- [{q, a, generated_by, ts}]
  goals_status JSONB NOT NULL DEFAULT '{}'               -- прогресс целей квалификации (adaptive)
);
CREATE INDEX sessions_quiz_idx ON sessions(quiz_id);

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),
  name            TEXT,
  phone           TEXT,
  email           TEXT,
  score           INT,                                   -- 0–100, NULL пока воркер не отработал
  segment         TEXT,                                  -- hot | warm | cold | junk
  summary         TEXT,
  first_line      TEXT,
  fraud_flags     JSONB NOT NULL DEFAULT '[]',
  billable        BOOLEAN NOT NULL DEFAULT true,
  crm_sync_status TEXT NOT NULL DEFAULT 'none',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX leads_workspace_idx ON leads(workspace_id, created_at DESC);

-- Интеграции и события -------------------------------------------------------

CREATE TABLE integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  type         TEXT NOT NULL,                            -- amocrm | bitrix24 | telegram | webhook | email
  config       JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE events (
  id         BIGSERIAL PRIMARY KEY,
  quiz_id    UUID,
  session_id UUID,
  type       TEXT NOT NULL,                              -- view | start | answer | drop | lead
  payload    JSONB NOT NULL DEFAULT '{}',
  ts         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_quiz_idx ON events(quiz_id, ts);

-- Очередь фоновых задач (скоринг, генерация результата) ----------------------

CREATE TABLE jobs (
  id          BIGSERIAL PRIMARY KEY,
  type        TEXT NOT NULL,                             -- score_lead | ...
  payload     JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pending',           -- pending | running | done | failed
  attempts    INT NOT NULL DEFAULT 0,
  run_after   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error       TEXT
);
CREATE INDEX jobs_pending_idx ON jobs(status, run_after) WHERE status = 'pending';
