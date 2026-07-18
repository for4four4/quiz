import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicQuiz = { id: number; slug: string; name: string; steps: unknown; design: unknown };

// GET /api/public/quiz/[slug] — публичный квиз для рантайма/виджета (CORS открыт)
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureSchema();
  const [row] = await query<PublicQuiz>(
    "SELECT id,slug,name,steps,design FROM quizzes WHERE slug=$1 AND status='active'",
    [slug]
  );
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
