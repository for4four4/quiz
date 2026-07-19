/**
 * Модель документа квиза (блочный редактор в духе Tilda).
 * Общая для редактора (`components/editor`) и публичного рантайма
 * (`components/quiz/QuizRuntime`). Без серверных зависимостей.
 */

export type BlockType = "heading" | "text" | "options" | "input" | "button" | "image" | "html";

export type BlockStyle = {
  width: number;        // % ширины карточки
  align: "left" | "center" | "right";
  fontSize: number;     // px
  fontWeight: number;   // 400 | 500 | 600 | 700
  color: string;        // цвет текста
  bg: string;           // фон блока ("transparent" или цвет)
  borderWidth: number;  // px
  borderColor: string;
  radius: number;       // px
  padY: number;         // вертикальный отступ, px
  padX: number;         // горизонтальный отступ, px
  marginTop: number;    // отступ сверху, px
  height: number;       // px (0 = авто) — для картинок/кнопок
  font: string;         // ключ из FONTS
};

export type Block = {
  id: string;
  type: BlockType;
  text?: string;                                  // heading / text / button
  options?: string[];                             // options
  field?: "name" | "phone" | "email" | "text";    // input
  placeholder?: string;                           // input
  src?: string;                                   // image (URL)
  html?: string;                                  // html (свой HTML/встраивание)
  goal?: string;                                  // цель Метрики/коллтрекинга при клике
  style: BlockStyle;
};

export type StepKind = "cover" | "question" | "contact";

export type Step = {
  id: string;
  kind: StepKind;
  title: string;                          // служебное имя шага в редакторе
  bg: { type: "color" | "image"; value: string };
  blocks: Block[];
  js?: string;                            // свой JS, выполняется при показе шага
  goal?: string;                          // цель Метрики/коллтрекинга при показе шага
};

export type QuizDoc = {
  v: 1;
  theme: { accent: string; font: string; bg: string };
  steps: Step[];
};

export const FONTS: Record<string, string> = {
  system: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif",
  rounded: "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, Menlo, Consolas, monospace",
};
export const FONT_LABELS: [string, string][] = [
  ["system", "Системный"],
  ["rounded", "Округлый"],
  ["serif", "С засечками"],
  ["mono", "Моноширинный"],
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function defStyle(p: Partial<BlockStyle> = {}): BlockStyle {
  return {
    width: 100,
    align: "center",
    fontSize: 16,
    fontWeight: 400,
    color: "#111827",
    bg: "transparent",
    borderWidth: 0,
    borderColor: "#e5e7eb",
    radius: 12,
    padY: 0,
    padX: 0,
    marginTop: 12,
    height: 0,
    font: "system",
    ...p,
  };
}

export function newBlock(type: BlockType, accent = "#28559c"): Block {
  switch (type) {
    case "heading":
      return { id: uid(), type, text: "Новый заголовок", style: defStyle({ fontSize: 22, fontWeight: 700, color: "#111827" }) };
    case "text":
      return { id: uid(), type, text: "Текст блока — кликните, чтобы изменить.", style: defStyle({ fontSize: 15, color: "#4b5563" }) };
    case "options":
      return { id: uid(), type, options: ["Вариант 1", "Вариант 2"], style: defStyle({ fontSize: 14, color: "#111827" }) };
    case "input":
      return { id: uid(), type, field: "text", placeholder: "Введите значение", style: defStyle({ fontSize: 14, borderWidth: 1, padY: 12, padX: 14, radius: 12 }) };
    case "button":
      return { id: uid(), type, text: "Кнопка", goal: "", style: defStyle({ fontSize: 15, fontWeight: 600, color: "#ffffff", bg: accent, padY: 14, padX: 16, radius: 12, width: 100 }) };
    case "image":
      return { id: uid(), type, src: "", style: defStyle({ width: 100, height: 180, radius: 12 }) };
    case "html":
      return { id: uid(), type, html: "<!-- свой HTML/встраивание -->", style: defStyle({ width: 100 }) };
  }
}

/** Простая модель (steps + design.cover/contactForm) → блочный документ. */
export function migrateToDoc(
  steps: { question?: string; options?: string[] }[] | undefined,
  design: { accent?: string; bg?: string; cover?: { title?: string; subtitle?: string; benefits?: string[] }; contactForm?: { title?: string; bonus?: string } } | undefined
): QuizDoc {
  const accent = design?.accent || "#28559c";
  const bg = design?.bg || "#ffffff";
  const cover = design?.cover || {};
  const contact = design?.contactForm || {};
  const out: Step[] = [];

  out.push({
    id: uid(), kind: "cover", title: "Обложка", bg: { type: "color", value: bg },
    blocks: [
      { id: uid(), type: "heading", text: cover.title || "Рассчитайте стоимость за 1 минуту", style: defStyle({ fontSize: 24, fontWeight: 700 }) },
      ...(cover.subtitle ? [{ id: uid(), type: "text" as const, text: cover.subtitle, style: defStyle({ fontSize: 15, color: "#6b7280" }) }] : []),
      ...((cover.benefits || []).map((b) => ({ id: uid(), type: "text" as const, text: "✓ " + b, style: defStyle({ fontSize: 14, color: "#374151" }) }))),
      { id: uid(), type: "button", text: "Пройти квиз", goal: "quiz_start", style: defStyle({ bg: accent, color: "#fff", fontWeight: 600, fontSize: 15, padY: 14, padX: 16, marginTop: 18 }) },
    ],
  });

  (steps || []).forEach((s) => {
    out.push({
      id: uid(), kind: "question", title: s.question || "Вопрос", bg: { type: "color", value: bg },
      blocks: [
        { id: uid(), type: "heading", text: s.question || "Вопрос", style: defStyle({ fontSize: 18, fontWeight: 600 }) },
        { id: uid(), type: "options", options: (s.options || []).filter(Boolean), style: defStyle({ fontSize: 14 }) },
      ],
    });
  });

  out.push({
    id: uid(), kind: "contact", title: "Контакты", bg: { type: "color", value: bg },
    blocks: [
      { id: uid(), type: "heading", text: contact.title || "Оставьте контакты", style: defStyle({ fontSize: 18, fontWeight: 600 }) },
      ...(contact.bonus ? [{ id: uid(), type: "text" as const, text: "🎁 " + contact.bonus, style: defStyle({ fontSize: 13, color: accent, fontWeight: 600 }) }] : []),
      { id: uid(), type: "input", field: "name", placeholder: "Ваше имя", style: defStyle({ fontSize: 14, borderWidth: 1, padY: 12, padX: 14 }) },
      { id: uid(), type: "input", field: "phone", placeholder: "Телефон", style: defStyle({ fontSize: 14, borderWidth: 1, padY: 12, padX: 14 }) },
      { id: uid(), type: "input", field: "email", placeholder: "E-mail (необязательно)", style: defStyle({ fontSize: 14, borderWidth: 1, padY: 12, padX: 14 }) },
      { id: uid(), type: "button", text: "Получить результат", goal: "quiz_submit", style: defStyle({ bg: accent, color: "#fff", fontWeight: 600, fontSize: 15, padY: 14, padX: 16, marginTop: 14 }) },
    ],
  });

  return { v: 1, theme: { accent, font: "system", bg }, steps: out };
}

/** Достаём простые шаги (вопрос/варианты) — для CRM, лидов и аналитики. */
export function deriveSteps(doc: QuizDoc): { question: string; options: string[] }[] {
  return doc.steps
    .filter((s) => s.kind === "question")
    .map((s) => {
      const heading = s.blocks.find((b) => b.type === "heading")?.text
        || s.blocks.find((b) => b.type === "text")?.text
        || s.title || "Вопрос";
      const opts = s.blocks.find((b) => b.type === "options")?.options || [];
      return { question: heading, options: opts };
    });
}

/** Совместимость: doc → design.cover/contactForm/accent/bg + сам doc. */
export function docToDesign(doc: QuizDoc) {
  const cover = doc.steps.find((s) => s.kind === "cover");
  const contact = doc.steps.find((s) => s.kind === "contact");
  const texts = (cover?.blocks || []).filter((b) => b.type === "text");
  return {
    doc,
    accent: doc.theme.accent,
    bg: doc.theme.bg,
    cover: {
      title: cover?.blocks.find((b) => b.type === "heading")?.text || "",
      subtitle: texts[0]?.text || "",
      benefits: texts.slice(1).map((t) => (t.text || "").replace(/^✓\s*/, "")),
    },
    contactForm: {
      title: contact?.blocks.find((b) => b.type === "heading")?.text || "Оставьте контакты",
      bonus: (contact?.blocks.find((b) => b.type === "text")?.text || "").replace(/^🎁\s*/, ""),
    },
  };
}

/** CSS-стиль блока для рендера (без специфики типа). */
export function blockCss(style: BlockStyle): Record<string, string | number> {
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    background: style.bg,
    border: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : "none",
    borderRadius: style.radius,
    padding: `${style.padY}px ${style.padX}px`,
    fontFamily: FONTS[style.font] || FONTS.system,
    lineHeight: 1.35,
    boxSizing: "border-box",
    ...(style.height ? { height: style.height } : {}),
  };
}
