import { query } from "./db";

export type QuizRow = {
  id: number;
  user_id: number;
  slug: string;
  name: string;
  steps: unknown;
  design: { doc?: { ab?: { b?: string; split?: number; enabled?: boolean } } } | null;
};

/**
 * Возвращает активный квиз по слагу с учётом A/B-теста:
 * если тест включён — с вероятностью `split`% отдаёт вариант B (другой
 * активный квиз того же владельца). Показы и заявки при этом пишутся на
 * выбранный вариант, так что статистика вариантов сравнима в кабинете.
 */
export async function pickAbVariant(slug: string): Promise<QuizRow | null> {
  const [a] = await query<QuizRow>(
    "SELECT id,user_id,slug,name,steps,design FROM quizzes WHERE slug=$1 AND status='active'",
    [slug]
  );
  if (!a) return null;
  const ab = a.design?.doc?.ab;
  if (!ab?.enabled || !ab.b || ab.b === slug) return a;
  const split = Math.max(0, Math.min(100, ab.split ?? 50));
  if (Math.random() * 100 >= split) return a;
  const [b] = await query<QuizRow>(
    "SELECT id,user_id,slug,name,steps,design FROM quizzes WHERE slug=$1 AND status='active' AND user_id=$2",
    [ab.b, a.user_id]
  );
  return b || a;
}
