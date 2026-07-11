import { config } from '../config.js';

/**
 * Абстракция LLM-провайдера (риск №1 из спеки).
 * Polza.ai — OpenAI-совместимый API, поэтому реализация — обычный fetch
 * на /chat/completions. Если понадобится сменить агрегатор — меняем только
 * этот файл, интерфейс generateJson/generateText остаётся.
 */

export type LlmTier = 'fast' | 'smart'; // fast = рантайм квиза (Haiku), smart = генерация в редакторе (Sonnet)

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateOptions {
  tier?: LlmTier;
  temperature?: number;
  maxTokens?: number;
}

class LlmError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function chatCompletion(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${config.polza.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.polza.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new LlmError(`LLM API ${res.status}: ${text.slice(0, 500)}`, res.status);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError('Пустой ответ модели');
  return content;
}

function model(tier: LlmTier): string {
  return tier === 'smart' ? config.polza.modelSmart : config.polza.modelFast;
}

/** Свободный текст (пока не используется, пригодится для стриминга). */
export async function generateText(
  system: string,
  user: string,
  opts: GenerateOptions = {},
): Promise<string> {
  return chatCompletion({
    model: model(opts.tier ?? 'fast'),
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ] satisfies ChatMessage[],
  });
}

/**
 * Структурный вывод: response_format json_schema (strict) + плагин
 * response-healing (Polza чинит невалидный JSON на своей стороне).
 * На случай, если модель всё же вернула JSON в ```-ограде — снимаем её.
 */
export async function generateJson<T>(
  system: string,
  user: string,
  schemaName: string,
  schema: Record<string, unknown>,
  opts: GenerateOptions = {},
): Promise<T> {
  const raw = await chatCompletion({
    model: model(opts.tier ?? 'fast'),
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2048,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ] satisfies ChatMessage[],
    response_format: {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    },
    plugins: [{ id: 'response-healing' }],
  });

  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new LlmError(`Модель вернула невалидный JSON: ${clean.slice(0, 300)}`);
  }
}
