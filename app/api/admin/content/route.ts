import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getSiteContent, saveSiteContent } from "@/lib/server/siteContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/content — редактируемый контент сайта (новости и пр.)
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ content: await getSiteContent() });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// PUT /api/admin/content — сохранить контент
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    return NextResponse.json({ content: await saveSiteContent(body) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
