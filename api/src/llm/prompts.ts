/**
 * Промпты 1–4 из спецификации. Плейсхолдеры подставляются функциями ниже.
 * Все схемы — JSON Schema для response_format (strict) Polza.ai.
 */

// ---------- Промпт 1. Генерация квиза по описанию бизнеса (smart) ----------

export interface QuizGenBrief {
  business_description: string;
  goal: string;
  geo: string;
  ideal_lead: string;
}

export interface GeneratedQuiz {
  quiz_title: string;
  questions: {
    title: string;
    type: 'single' | 'multi' | 'slider' | 'text';
    options: string[];
    why: string;
  }[];
  offer_page: { headline: string; subheadline: string; bonus: string };
  qualification_goals: string[];
}

export const quizGenSystem = `Ты — маркетолог-квизолог с опытом 500+ квизов для лидогенерации в рунете.
Создай квиз для сбора заявок по брифу ниже.

Правила (нарушение любого = брак):
1. 4–7 вопросов. Первый вопрос — самый лёгкий и вовлекающий, отвечается за 2 секунды.
2. Вопросы — только про ПОТРЕБНОСТИ и ситуацию клиента, НИКОГДА про технические детали,
   в которых клиент не разбирается (не «какой фундамент?», а «какой у вас участок?»).
3. Каждый вопрос имеет 3–6 вариантов ответа + где уместно вариант «Ещё не решил(а)».
4. Формулировки — короткие, разговорные, на «вы», без канцелярита и штампов.
5. Последним объектом верни offer_page: заголовок и подзаголовок для формы контактов,
   с конкретным бонусом за оставленный контакт (из брифа или предложи уместный).
6. Добавь qualification_goals: список из 3–5 фактов, которые квиз должен выяснить,
   чтобы отдел продаж понял ценность лида (бюджет, сроки, готовность, ЛПР и т.п.).

Поле "why" — одна фраза, зачем этот вопрос (показываем владельцу в редакторе).`;

export function quizGenUser(b: QuizGenBrief): string {
  return `Бриф:
- Бизнес: ${b.business_description}
- Цель квиза: ${b.goal}
- География: ${b.geo}
- Хороший лид — это: ${b.ideal_lead}`;
}

export const quizGenSchema = {
  type: 'object',
  properties: {
    quiz_title: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string', enum: ['single', 'multi', 'slider', 'text'] },
          options: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
        },
        required: ['title', 'type', 'options', 'why'],
        additionalProperties: false,
      },
    },
    offer_page: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        subheadline: { type: 'string' },
        bonus: { type: 'string' },
      },
      required: ['headline', 'subheadline', 'bonus'],
      additionalProperties: false,
    },
    qualification_goals: { type: 'array', items: { type: 'string' } },
  },
  required: ['quiz_title', 'questions', 'offer_page', 'qualification_goals'],
  additionalProperties: false,
};

// ---------- Промпт 2. Адаптивный следующий вопрос (fast, рантайм) ----------

export interface AdaptiveInput {
  business_context: unknown;
  qualification_goals: string[];
  transcript: unknown[];
  asked_count: number;
  max_questions: number;
}

export interface AdaptiveStep {
  action: 'ask' | 'finish';
  question: {
    title: string;
    type: 'single' | 'multi' | 'text';
    options: string[];
  } | null;
  flag: 'gibberish' | null;
  goals_status: Record<string, 'closed' | 'open'>;
}

export const adaptiveSystem = `Ты ведёшь квалификационный диалог с посетителем сайта вместо статичного квиза.
Твоя задача — за минимум вопросов выяснить факты из списка целей и подвести
человека к форме контактов. Ты дружелюбный консультант, не анкета.

Правила:
1. Если все цели квалификации закрыты ИЛИ достигнут лимит вопросов —
   верни action: "finish".
2. Иначе верни ОДИН следующий вопрос, закрывающий самую важную незакрытую цель.
3. Учитывай предыдущие ответы: не переспрашивай, ссылайся на сказанное
   («Вы упомянули участок 6 соток — ...»).
4. Если последний ответ был свободным текстом — сначала пойми его; если он
   бессмысленный (случайные символы), верни flag: "gibberish" и всё равно
   продолжи вежливо.
5. Вопрос ≤ 15 слов, варианты ≤ 5 слов каждый, 3–5 вариантов,
   разговорный тон, на «вы».`;

export function adaptiveUser(i: AdaptiveInput): string {
  return `Контекст бизнеса: ${JSON.stringify(i.business_context)}
Цели квалификации (что нужно выяснить): ${JSON.stringify(i.qualification_goals)}
Уже выяснено (история диалога): ${JSON.stringify(i.transcript)}
Задано вопросов: ${i.asked_count} из максимум ${i.max_questions}`;
}

export const adaptiveSchema = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['ask', 'finish'] },
    question: {
      anyOf: [
        {
          type: 'object',
          properties: {
            title: { type: 'string' },
            type: { type: 'string', enum: ['single', 'multi', 'text'] },
            options: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'type', 'options'],
          additionalProperties: false,
        },
        { type: 'null' },
      ],
    },
    flag: { anyOf: [{ type: 'string', enum: ['gibberish'] }, { type: 'null' }] },
    goals_status: {
      type: 'object',
      additionalProperties: { type: 'string', enum: ['closed', 'open'] },
    },
  },
  required: ['action', 'question', 'flag', 'goals_status'],
  additionalProperties: false,
};

// ---------- Промпт 3. Скоринг лида и резюме (fast, фоновая задача) ----------

export interface ScoringInput {
  business_context: unknown;
  ideal_lead: string;
  transcript: unknown[];
  name: string | null;
  phone: string | null;
  email: string | null;
  fraud_flags: string[];
}

export interface ScoringResult {
  score: number;
  segment: 'hot' | 'warm' | 'cold' | 'junk';
  summary: string;
  first_line: string;
  junk_reasons: string[];
}

export const scoringSystem = `Ты — руководитель отдела продаж. Оцени лид с квиза и подготовь резюме для менеджера.

Задачи:
1. score 0–100: насколько лид соответствует критериям (бюджет, срочность,
   конкретность потребности, полнота ответов).
2. segment: "hot" (звонить в первый час), "warm", "cold", "junk"
   (бессмысленные ответы, тестовое прохождение, спам).
3. summary: 2–4 предложения для менеджера — что человек хочет, ключевые
   параметры, на что обратить внимание в разговоре. Без воды.
4. first_line: одна фраза, с которой менеджеру стоит начать звонок,
   персонализированная под ответы клиента.
5. junk_reasons: если segment="junk" — список причин, иначе пустой список.`;

export function scoringUser(i: ScoringInput): string {
  return `Бизнес: ${JSON.stringify(i.business_context)}
Критерии хорошего лида от владельца: ${i.ideal_lead}
Диалог с клиентом: ${JSON.stringify(i.transcript)}
Контакты: имя=${i.name ?? '—'}, телефон=${i.phone ?? '—'}, email=${i.email ?? '—'}
Программные проверки антифрода (учти при оценке): ${JSON.stringify(i.fraud_flags)}`;
}

export const scoringSchema = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    segment: { type: 'string', enum: ['hot', 'warm', 'cold', 'junk'] },
    summary: { type: 'string' },
    first_line: { type: 'string' },
    junk_reasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'segment', 'summary', 'first_line', 'junk_reasons'],
  additionalProperties: false,
};

// ---------- Промпт 4. Персональный результат для посетителя (fast) ----------

export interface ResultInput {
  business_context: unknown;
  transcript: unknown[];
  result_template: unknown;
  cta_text: string;
}

export interface PersonalResult {
  headline: string;
  body: string;
}

export const resultSystem = `Ты пишешь персональный результат квиза для посетителя. Это НЕ реклама,
а полезная выжимка, из-за которой человек рад, что оставил контакты.

Правила:
1. 3–5 предложений: отрази 2–3 конкретных ответа клиента («под ваш участок
   6 соток и бюджет до 5 млн...»), дай предварительную рекомендацию/вилку/
   следующий шаг.
2. Никаких выдуманных цен и обещаний, которых нет в контексте бизнеса.
   Если данных для цифр нет — говори вилками из контекста бизнеса или без цифр.
3. Тон — эксперт, который уже начал работать над задачей клиента.
4. Заверши фразой-мостиком к CTA.`;

export function resultUser(i: ResultInput): string {
  return `Бизнес и оффер: ${JSON.stringify(i.business_context)}
Диалог: ${JSON.stringify(i.transcript)}
Шаблон результата от владельца (если есть): ${JSON.stringify(i.result_template)}
CTA: ${i.cta_text}`;
}

export const resultSchema = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['headline', 'body'],
  additionalProperties: false,
};
