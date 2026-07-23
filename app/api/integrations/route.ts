import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";
import { isPublicHttpsUrl } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntegrationRow = { id: string; kind: string; config: Record<string, string>; enabled: boolean };

const KINDS = new Set([
  "amocrm", "bitrix24", "telegram", "max", "vk", "webhook", "metrika", "calltracking",
]);

// GET /api/integrations — подключённые интеграции пользователя
export async function GET() {
  try {
    const s = await requireSession();
    await ensureSchema();
    const rows = await query<IntegrationRow>(
      "SELECT id,kind,config,enabled FROM integrations WHERE user_id=$1",
      [s.uid]
    );
    return NextResponse.json({ integrations: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// POST /api/integrations — подключить/обновить интеграцию (upsert по kind)
export async function POST(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const { kind, config, enabled } = (await req.json()) as {
      kind?: string; config?: Record<string, string>; enabled?: boolean;
    };
    if (!kind || !KINDS.has(kind)) {
      return NextResponse.json({ error: "Неизвестная интеграция" }, { status: 400 });
    }
    // SSRF-защита (аудит H2): URL-поля должны быть публичным https
    const cfg = config || {};
    for (const key of ["url", "webhookUrl", "domain"]) {
      const val = (cfg[key] || "").trim();
      if (!val) continue;
      const asUrl = key === "domain" && !/^https?:\/\//.test(val) ? `https://${val}` : val;
      if (!isPublicHttpsUrl(asUrl)) {
        return NextResponse.json({ error: `Недопустимый адрес в поле «${key}» (нужен публичный https)` }, { status: 400 });
      }
    }
    const [row] = await query<IntegrationRow>(
      `INSERT INTO integrations (user_id,kind,config,enabled)
         VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id,kind)
         DO UPDATE SET config = EXCLUDED.config, enabled = EXCLUDED.enabled
       RETURNING id,kind,config,enabled`,
      [s.uid, kind, JSON.stringify(config || {}), enabled ?? true]
    );
    return NextResponse.json({ integration: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// DELETE /api/integrations?kind=telegram — отключить интеграцию
export async function DELETE(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const kind = new URL(req.url).searchParams.get("kind");
    if (!kind) return NextResponse.json({ error: "kind обязателен" }, { status: 400 });
    await query("DELETE FROM integrations WHERE user_id=$1 AND kind=$2", [s.uid, kind]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
