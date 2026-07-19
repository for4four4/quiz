import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { headers: cors });
}

const TYPES = new Set(["open", "step", "contact"]);

type Body = { slug: string; type: string; step?: number; source?: string; session?: string };

// POST /api/public/event — трекинг воронки квиза (open/step/contact). Best-effort.
// Событие "lead" пишется на сервере в /api/public/lead.
export async function POST(req: Request) {
  try {
    await ensureSchema();
    const b = (await req.json()) as Body;
    if (!b.slug || !TYPES.has(b.type)) {
      return NextResponse.json({ ok: false }, { status: 400, headers: cors });
    }
    const [quiz] = await query<{ id: number }>(
      "SELECT id FROM quizzes WHERE slug=$1 AND status='active'",
      [b.slug]
    );
    if (!quiz) return NextResponse.json({ ok: false }, { status: 404, headers: cors });

    await query(
      "INSERT INTO events (quiz_id,type,step,source,session) VALUES ($1,$2,$3,$4,$5)",
      [
        quiz.id,
        b.type,
        b.type === "step" && Number.isInteger(b.step) ? b.step : null,
        (b.source || "прямая ссылка").slice(0, 60),
        (b.session || "").slice(0, 64),
      ]
    );
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch {
    // Аналитика не должна ломать прохождение квиза
    return NextResponse.json({ ok: false }, { status: 200, headers: cors });
  }
}
