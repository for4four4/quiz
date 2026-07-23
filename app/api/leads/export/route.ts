import { ensureSchema, query } from "@/lib/server/db";
import { requireSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  created_at: string; quiz_name: string; name: string; phone: string; email: string;
  source: string; score: number; heat: string; status: string; summary: string; answers: unknown;
  ip: string; utm: unknown;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

const HEAT: Record<string, string> = { hot: "Горячий", warm: "Тёплый", cold: "Холодный" };
const STATUS: Record<string, string> = { new: "Новая", work: "В работе", done: "Успешная", rejected: "Отказ" };

function esc(v: string): string {
  const s = (v ?? "").toString();
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/leads/export[?quiz=id] — выгрузка заявок в CSV (Excel-совместимо)
export async function GET(req: Request) {
  try {
    const s = await requireSession();
    await ensureSchema();
    const quizId = new URL(req.url).searchParams.get("quiz");
    const rows = await query<Row>(
      `SELECT l.created_at, q.name AS quiz_name, l.name, l.phone, l.email, l.source,
              l.score, l.heat, l.status, l.summary, l.answers, l.ip, l.utm
         FROM leads l JOIN quizzes q ON q.id = l.quiz_id
        WHERE q.user_id = $1 ${quizId ? "AND l.quiz_id = $2" : ""}
        ORDER BY l.created_at DESC`,
      quizId ? [s.uid, quizId] : [s.uid]
    );

    const header = ["Дата", "Квиз", "Имя", "Телефон", "E-mail", "Источник", "Скоринг", "Тип", "Статус", "Ответы", "Обобщение ИИ", "IP", ...UTM_KEYS, "Реферер"];
    const lines = [header.join(";")];
    for (const r of rows) {
      const answers = Array.isArray(r.answers)
        ? (r.answers as { q: string; a: string }[]).map((a) => `${a.q}: ${a.a}`).join(" | ")
        : "";
      const utm = (r.utm && typeof r.utm === "object" ? r.utm : {}) as Record<string, string>;
      lines.push([
        new Date(r.created_at).toLocaleString("ru-RU"),
        r.quiz_name, r.name, r.phone, r.email, r.source,
        String(r.score), HEAT[r.heat] || r.heat, STATUS[r.status] || r.status,
        answers, r.summary,
        r.ip || "", ...UTM_KEYS.map((k) => utm[k] || ""), utm.referrer || "",
      ].map(esc).join(";"));
    }
    // BOM — чтобы кириллица корректно открывалась в Excel
    const csv = "﻿" + lines.join("\r\n");
    const fname = `qvalify-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response("Ошибка", { status: 500 });
  }
}
