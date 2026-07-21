import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { pickAbVariant } from "@/lib/server/ab";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/public/quiz/[slug] — публичный квиз для рантайма/виджета (CORS открыт).
// Если у квиза включён A/B-тест, сервер с заданной вероятностью отдаёт вариант B —
// его показы/заявки пишутся на B, поэтому статистика вариантов сравнивается в кабинете.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureSchema();
  const row = await pickAbVariant(slug);
  if (!row) return NextResponse.json({ error: "Квиз не найден" }, { status: 404, headers: cors() });
  return NextResponse.json({ quiz: row }, { headers: cors() });
}

export function OPTIONS() {
  return new NextResponse(null, { headers: cors() });
}

function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}
