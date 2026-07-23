import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserSettings = {
  dedupeHours?: number;
  ipBlacklist?: string[];
  emailNotify?: string; // адрес для e-mail-уведомлений по умолчанию
};

// GET /api/settings — настройки аккаунта (защита от фрода и пр.)
export async function GET() {
  try {
    const s = await requireSession();
    await ensureSchema();
    const [u] = await query<{ settings: UserSettings | null }>("SELECT settings FROM users WHERE id=$1", [s.uid]);
    return NextResponse.json({ settings: u?.settings || {} });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// PUT /api/settings — сохранить настройки аккаунта
export async function PUT(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const body = (await req.json()) as UserSettings;
    const clean: UserSettings = {
      dedupeHours: Math.max(0, Math.min(720, Math.round(Number(body.dedupeHours) || 0))),
      ipBlacklist: Array.isArray(body.ipBlacklist) ? body.ipBlacklist.map((x) => String(x).trim()).filter(Boolean).slice(0, 500) : [],
      emailNotify: (body.emailNotify || "").trim().slice(0, 200),
    };
    await query("UPDATE users SET settings=$2 WHERE id=$1", [s.uid, JSON.stringify(clean)]);
    return NextResponse.json({ settings: clean });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
