export type Answer = { q: string; a: string; t?: string };

/**
 * Lightweight heuristic lead score (0..100) + heat bucket.
 * Real signals (budget, urgency, completion) nudge the score; this is a
 * deterministic baseline that the AI summary complements.
 */
export function scoreLead(answers: Answer[], opts: { finished: boolean; hasPhone: boolean } = { finished: true, hasPhone: true }): {
  score: number;
  heat: "hot" | "warm" | "cold";
} {
  let score = 30;
  if (opts.hasPhone) score += 20;
  if (opts.finished) score += 15;
  score += Math.min(20, answers.length * 4);

  const text = answers.map((a) => a.a.toLowerCase()).join(" ");
  // Urgency
  if (/(срочно|как можно скорее|ближайш|этот месяц|сейчас)/.test(text)) score += 12;
  // Budget signals — higher ranges score higher
  if (/(600|1\s?000|млн|миллион|бизнес|под ключ)/.test(text)) score += 10;
  else if (/(400|500|300–400|300-400)/.test(text)) score += 6;
  // Negative signals
  if (/(пока не знаю|не готов|просто смотрю|до 100)/.test(text)) score -= 10;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const heat = score >= 75 ? "hot" : score >= 50 ? "warm" : "cold";
  return { score, heat };
}
