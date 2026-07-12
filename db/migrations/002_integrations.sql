-- 002_integrations.sql — одна интеграция каждого типа на воркспейс + учёт отправленных уведомлений

-- На воркспейс — не больше одной интеграции каждого типа (telegram, webhook, …):
-- так админка делает upsert по (workspace_id, type), а не плодит дубли.
ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS enabled     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS integrations_ws_type_idx ON integrations(workspace_id, type);

-- Чтобы не слать одно и то же уведомление дважды при повторной обработке задачи.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
