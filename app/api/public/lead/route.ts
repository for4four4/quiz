import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { scoreLead, type Answer } from "@/lib/server/scoring";
import { summarizeLead } from "@/lib/server/prompts";
import { dispatchLead } from "@/lib/server/integrations";
import { env } from "@/lib/server/env";

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

type Body = {
  slug: string;
  name?: string;
  phone?: string;
  email?: string;
  answers?: Answer[];
  source?: string;
  finished?: boolean;
};

// POST /api/public/lead — приём заявки из квиза: скоринг, обобщение ИИ, диспатч в интеграции
export async function POST(req: Request) {
  try {
    await ensureSchema();
    const b = (await req.json()) as Body;
    if (!b.slug || !b.phone) {
      return NextResponse.json({ error: "Нужны slug и телефон" }, { status: 400, headers: cors });
    }

    const [quiz] = await query<{ id: number; user_id: number; name: string }>(
      "SELECT id,user_id,name FROM quizzes WHERE slug=$1 AND status='active'",
      [b.slug]
    );
    if (!quiz) return NextResponse.json({ error: "Квиз не найден" }, { status: 404, headers: cors });

    const answers = b.answers || [];
    const { score, heat } = scoreLead(answers, { finished: b.finished ?? true, hasPhone: !!b.phone });

    // AI summary — best-effort, не блокирует приём заявки
    let summary = "";
    if (env.polza.apiKey) {
      try {
        summary = await summarizeLead(quiz.name, answers.map((a) => ({ q: a.q, a: a.a })));
      } catch {
        summary = "";
      }
    }

    const [lead] = await query<{ id: number }>(
      `INSERT INTO leads (quiz_id,name,phone,email,answers,source,score,heat,summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [quiz.id, b.name || "", b.phone, b.email || "", JSON.stringify(answers), b.source || "прямая ссылка", score, heat, summary]
    );

    // Событие воронки "lead" (best-effort, не влияет на приём заявки)
    await query(
      "INSERT INTO events (quiz_id,type,source) VALUES ($1,'lead',$2)",
      [quiz.id, b.source || "прямая ссылка"]
    ).catch(() => {});

    // Диспатч в интеграции пользователя
    const integrations = await query<{ kind: string; config: Record<string, string>; enabled: boolean }>(
      "SELECT kind,config,enabled FROM integrations WHERE user_id=$1 AND enabled=true",
      [quiz.user_id]
    );
    if (integrations.length) {
      await dispatchLead(integrations, {
        quizName: quiz.name,
        name: b.name || "",
        phone: b.phone,
        email: b.email,
        answers: answers.map((a) => ({ q: a.q, a: a.a })),
        source: b.source || "прямая ссылка",
        score,
        summary,
      });
    }

    return NextResponse.json({ ok: true, id: lead.id, score, heat }, { headers: cors });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500, headers: cors });
  }
}
