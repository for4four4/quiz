import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { scoreLead, type Answer } from "@/lib/server/scoring";
import { summarizeLead } from "@/lib/server/prompts";
import { dispatchLead } from "@/lib/server/integrations";
import { env } from "@/lib/server/env";
import { rateLimit } from "@/lib/server/ratelimit";

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
  utm?: Record<string, string>; // скрытые поля: utm_*, referrer, page
};

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || req.headers.get("x-real-ip") || "").trim();
}

// POST /api/public/lead — приём заявки из квиза: скоринг, обобщение ИИ, диспатч в интеграции
export async function POST(req: Request) {
  try {
    await ensureSchema();
    const b = (await req.json()) as Body;
    if (!b.slug || !b.phone) {
      return NextResponse.json({ error: "Нужны slug и телефон" }, { status: 400, headers: cors });
    }

    // Анти-спам/анти-DoS (аудит H3): защищает БД, платный LLM и рассылки в CRM.
    const ip = clientIp(req);
    const perIp = rateLimit(`lead:ip:${ip}`, 10, 60_000);
    const perSlug = rateLimit(`lead:slug:${b.slug}`, 80, 60_000);
    if (!perIp.ok || !perSlug.ok) {
      return NextResponse.json({ error: "Слишком часто, попробуйте позже" }, { status: 429, headers: cors });
    }

    const [quiz] = await query<{ id: number; user_id: number; name: string; design: { integrations?: Record<string, { enabled?: boolean; config?: Record<string, string> }> } | null }>(
      "SELECT id,user_id,name,design FROM quizzes WHERE slug=$1 AND status='active'",
      [b.slug]
    );
    if (!quiz) return NextResponse.json({ error: "Квиз не найден" }, { status: 404, headers: cors });

    const utm = b.utm && typeof b.utm === "object" ? b.utm : {};

    // Защита от фрода: чёрный список IP + защита от дублей (настройки владельца)
    const [owner] = await query<{ settings: { ipBlacklist?: string[]; dedupeHours?: number } | null }>(
      "SELECT settings FROM users WHERE id=$1",
      [quiz.user_id]
    );
    const protect = owner?.settings || {};
    if (ip && Array.isArray(protect.ipBlacklist) && protect.ipBlacklist.map((x) => x.trim()).includes(ip)) {
      return NextResponse.json({ error: "Заявка отклонена" }, { status: 403, headers: cors });
    }
    const dedupeHours = Number(protect.dedupeHours || 0);
    if (dedupeHours > 0) {
      const [dup] = await query<{ id: number }>(
        `SELECT id FROM leads WHERE quiz_id=$1 AND phone=$2 AND created_at > now() - make_interval(hours => $3) LIMIT 1`,
        [quiz.id, b.phone, dedupeHours]
      );
      if (dup) return NextResponse.json({ ok: true, duplicate: true }, { headers: cors });
    }

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
      `INSERT INTO leads (quiz_id,name,phone,email,answers,source,score,heat,summary,ip,utm)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [quiz.id, b.name || "", b.phone, b.email || "", JSON.stringify(answers), b.source || "прямая ссылка", score, heat, summary, ip, JSON.stringify(utm)]
    );

    // Событие воронки "lead" (best-effort, не влияет на приём заявки)
    await query(
      "INSERT INTO events (quiz_id,type,source) VALUES ($1,'lead',$2)",
      [quiz.id, b.source || "прямая ссылка"]
    ).catch(() => {});

    // Диспатч в интеграции пользователя. По умолчанию заявка идёт во все
    // подключённые каналы; правила конкретного квиза (design.integrations)
    // могут отключить канал или переопределить ключи для этого квиза.
    const rules = quiz.design?.integrations || {};
    const rows = await query<{ kind: string; config: Record<string, string>; enabled: boolean }>(
      "SELECT kind,config,enabled FROM integrations WHERE user_id=$1 AND enabled=true",
      [quiz.user_id]
    );
    const integrations = rows
      .filter((i) => rules[i.kind]?.enabled !== false)
      .map((i) => {
        const over = rules[i.kind]?.config || {};
        const filled = Object.fromEntries(Object.entries(over).filter(([, v]) => v && String(v).trim()));
        return Object.keys(filled).length ? { ...i, config: { ...i.config, ...filled } } : i;
      });
    // E-mail: работает через SMTP (.env) + адрес получателя из настроек квиза.
    const emailRule = rules.email;
    if (emailRule?.enabled !== false && emailRule?.config?.to && emailRule.config.to.trim()) {
      integrations.push({ kind: "email", config: { to: emailRule.config.to.trim() }, enabled: true });
    }
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
