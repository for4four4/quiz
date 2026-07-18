import { complete } from "./llm";

export type GenerateInput = {
  business: string;
  goal: string;
  questions: number;
  bonus: string;
  tone: string;
  calc: boolean;
};

export type GeneratedQuiz = {
  name: string;
  cover: { title: string; subtitle: string; benefits: string[] };
  steps: { question: string; options: string[] }[];
  calculator?: { label: string };
  contactForm: { title: string; fields: string[]; bonus: string };
};

const SYSTEM = `Ты — эксперт по маркетинговым квизам для лидогенерации на русском языке.
Собираешь квиз под нишу клиента: цепляющая обложка, вопросы с вариантами и ветвлением,
форма контактов с бонусом. Пиши живо и по-русски, без канцелярита и англицизмов.
Отвечай СТРОГО валидным JSON по схеме, без markdown и пояснений.`;

/** Ask the model to assemble a full quiz draft from a short brief. */
export async function generateQuiz(input: GenerateInput): Promise<GeneratedQuiz> {
  const schema = `{
  "name": "короткое название квиза",
  "cover": { "title": "заголовок обложки", "subtitle": "подзаголовок", "benefits": ["3 преимущества"] },
  "steps": [ { "question": "текст вопроса", "options": ["2-4 варианта"] } ],
  "calculator": ${input.calc ? '{ "label": "как считаем стоимость" }' : "null"},
  "contactForm": { "title": "заголовок формы", "fields": ["Имя","Телефон"], "bonus": "бонус за прохождение" }
}`;

  const user = `Ниша и оффер: ${input.business}
Цель квиза: ${input.goal}
Количество вопросов: ${input.questions}
Бонус за прохождение: ${input.bonus}
Тон текстов: ${input.tone}
Калькулятор стоимости: ${input.calc ? "да" : "нет"}

Верни JSON ровно по схеме (ровно ${input.questions} вопросов в steps):
${schema}`;

  const raw = await complete({ system: SYSTEM, user, smart: true, json: true });
  return JSON.parse(raw) as GeneratedQuiz;
}

/** One-paragraph sales summary of a lead for the CRM card. */
export async function summarizeLead(
  quizName: string,
  answers: { q: string; a: string }[]
): Promise<string> {
  const user = `Квиз: ${quizName}
Ответы клиента:
${answers.map((a) => `- ${a.q}: ${a.a}`).join("\n")}

Напиши для менеджера краткое обобщение (2-3 предложения): что нужно клиенту,
насколько он «горячий» и что сделать первым шагом. Только текст, без JSON.`;
  return complete({ system: "Ты — ассистент отдела продаж. Пиши по-русски, кратко и по делу.", user });
}
