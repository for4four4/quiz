import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = new Set(["free", "start", "pro", "biz"]);

// PATCH /api/admin/users/[id] — изменить тариф, лимит заявок, срок действия, роль
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await ensureSchema();
    const { id } = await params;
    const b = (await req.json()) as { plan?: string; leadLimit?: number; validUntil?: string | null; role?: string };

    if (b.plan !== undefined && !PLANS.has(b.plan)) {
      return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400 });
    }
    if (b.role !== undefined && !["user", "admin"].includes(b.role)) {
      return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
    }
    const leadLimit = b.leadLimit === undefined ? null : Math.max(0, Math.min(1_000_000, Math.round(Number(b.leadLimit) || 0)));
    const validUntil = b.validUntil === undefined ? undefined : (b.validUntil || null);

    const [row] = await query<{ id: number }>(
      `UPDATE users SET
         plan = COALESCE($2, plan),
         lead_limit = COALESCE($3, lead_limit),
         role = COALESCE($4, role),
         valid_until = CASE WHEN $5::boolean THEN $6::date ELSE valid_until END
       WHERE id = $1
       RETURNING id`,
      [id, b.plan ?? null, leadLimit, b.role ?? null, validUntil !== undefined, validUntil ?? null]
    );
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
