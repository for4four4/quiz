import { generateJson } from '../llm/client.js';
import {
  quizGenSystem, quizGenUser, quizGenSchema, type QuizGenBrief, type GeneratedQuiz,
  adaptiveSystem, adaptiveUser, adaptiveSchema, type AdaptiveInput, type AdaptiveStep,
  scoringSystem, scoringUser, scoringSchema, type ScoringInput, type ScoringResult,
  resultSystem, resultUser, resultSchema, type ResultInput, type PersonalResult,
  funnelSystem, funnelUser, funnelSchema, type FunnelInput, type FunnelAnalysis,
} from '../llm/prompts.js';

/** Промпт 1 — Sonnet, редактор. Главный «вау-момент» онбординга. */
export function generateQuiz(brief: QuizGenBrief): Promise<GeneratedQuiz> {
  return generateJson<GeneratedQuiz>(
    quizGenSystem, quizGenUser(brief), 'generated_quiz', quizGenSchema,
    { tier: 'smart', temperature: 0.5, maxTokens: 3000 },
  );
}

/** Промпт 2 — Haiku, рантайм виджета. Целевая задержка 1–2 сек. */
export function nextAdaptiveStep(input: AdaptiveInput): Promise<AdaptiveStep> {
  return generateJson<AdaptiveStep>(
    adaptiveSystem, adaptiveUser(input), 'adaptive_step', adaptiveSchema,
    { tier: 'fast', temperature: 0.2, maxTokens: 600 },
  );
}

/** Промпт 3 — фоновый воркер после отправки контактов. */
export function scoreLead(input: ScoringInput): Promise<ScoringResult> {
  return generateJson<ScoringResult>(
    scoringSystem, scoringUser(input), 'lead_scoring', scoringSchema,
    { tier: 'fast', temperature: 0.1, maxTokens: 800 },
  );
}

/** Промпт 4 — персональный результат для посетителя. */
export function personalResult(input: ResultInput): Promise<PersonalResult> {
  return generateJson<PersonalResult>(
    resultSystem, resultUser(input), 'personal_result', resultSchema,
    { tier: 'fast', temperature: 0.4, maxTokens: 600 },
  );
}

/** Промпт 5 — ИИ-аналитик воронки (Sonnet, по кнопке в аналитике). */
export function analyzeFunnel(input: FunnelInput): Promise<FunnelAnalysis> {
  return generateJson<FunnelAnalysis>(
    funnelSystem, funnelUser(input), 'funnel_analysis', funnelSchema,
    { tier: 'smart', temperature: 0.3, maxTokens: 1500 },
  );
}
