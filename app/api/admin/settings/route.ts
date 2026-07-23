import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getSiteSettings, saveSiteSettings } from "@/lib/server/siteSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/settings — глобальные настройки сайта (аналитика/верификация)
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ settings: await getSiteSettings() });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// PUT /api/admin/settings — сохранить настройки сайта
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    return NextResponse.json({ settings: await saveSiteSettings(body) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
