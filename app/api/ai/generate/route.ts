import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth";
import { generateQuiz, type GenerateInput } from "@/lib/server/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireSession();
    const body = (await req.json()) as Partial<GenerateInput>;
    if (!body.business) return NextResponse.json({ error: "Опишите бизнес" }, { status: 400 });

    const quiz = await generateQuiz({
      business: body.business,
      goal: body.goal || "Заявки и лиды",
      questions: Math.max(3, Math.min(10, body.questions || 5)),
      bonus: body.bonus || "Скидка",
      tone: body.tone || "Дружелюбный",
      calc: body.calc ?? true,
    });
    return NextResponse.json({ quiz });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : "Ошибка генерации";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
