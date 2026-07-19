"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

export type Step = { question: string; options?: string[] };
export type PublicQuiz = {
  slug: string;
  name: string;
  steps: Step[];
  design: {
    cover?: { title?: string; subtitle?: string; benefits?: string[] };
    contactForm?: { title?: string; bonus?: string };
    accent?: string;
  };
  metrikaCounter?: string;
};

type Ym = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };

const ACCENT_DEFAULT = "#28559c";

export default function QuizRuntime({ quiz }: { quiz: PublicQuiz }) {
  const accent = quiz.design?.accent || ACCENT_DEFAULT;
  const steps = useMemo(() => quiz.steps.filter((s) => s && s.question), [quiz.steps]);
  const cover = quiz.design?.cover;
  const contact = quiz.design?.contactForm;

  // -1 = обложка · 0..n-1 = вопросы · n = форма контактов · "done" = спасибо
  const [idx, setIdx] = useState<number>(cover ? -1 : 0);
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Трекинг воронки: open / step / contact (best-effort, не блокирует квиз)
  const sessionRef = useRef<string>("");
  const trackedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    sessionRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }, []);
  // Яндекс.Метрика: счётчик владельца квиза + цели на шаги/заявку
  useEffect(() => {
    const c = quiz.metrikaCounter;
    if (!c || typeof window === "undefined") return;
    const w = window as unknown as { ym?: Ym };
    if (!w.ym) {
      const stub = ((...a: unknown[]) => { (stub.a = stub.a || []).push(a); }) as Ym;
      stub.l = Date.now();
      w.ym = stub;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://mc.yandex.ru/metrika/tag.js";
      document.head.appendChild(s);
    }
    w.ym(Number(c), "init", { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }, [quiz.metrikaCounter]);
  const ymGoal = (name: string) => {
    const c = quiz.metrikaCounter;
    if (!c || typeof window === "undefined") return;
    const w = window as unknown as { ym?: Ym };
    w.ym?.(Number(c), "reachGoal", name);
  };

  const track = (type: "open" | "step" | "contact", step?: number) => {
    const key = type === "step" ? `step${step}` : type;
    if (trackedRef.current.has(key)) return;
    trackedRef.current.add(key);
    ymGoal(type === "open" ? "quiz_open" : type === "contact" ? "quiz_contact" : "quiz_step");
    try {
      fetch("/api/public/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: quiz.slug, type, step, source: "прямая ссылка", session: sessionRef.current }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };
  useEffect(() => { track("open"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (idx >= 0 && idx < steps.length) track("step", idx);
    else if (idx >= steps.length) track("contact");
  }, [idx, steps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = steps.length + 1; // вопросы + форма
  const progress =
    idx < 0 ? 0 : Math.round((Math.min(idx, total) / total) * 100);

  function pick(q: string, a: string) {
    setAnswers((prev) => [...prev.filter((p) => p.q !== q), { q, a }]);
    setIdx((i) => i + 1);
  }

  async function submit() {
    setError("");
    if (!phone.trim()) {
      setError("Укажите телефон");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: quiz.slug,
          name,
          phone,
          email,
          answers,
          source: "прямая ссылка",
          finished: true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Не удалось отправить");
      ymGoal("quiz_lead");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={logoDot(accent)} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{quiz.name}</span>
        </div>

        {!done && (
          <div style={barStyle}>
            <div style={{ ...fillStyle, width: `${progress}%`, background: accent }} />
          </div>
        )}

        {/* Обложка */}
        {idx === -1 && cover && (
          <div>
            <h1 style={coverTitle}>{cover.title || quiz.name}</h1>
            {cover.subtitle && <p style={coverSub}>{cover.subtitle}</p>}
            {!!cover.benefits?.length && (
              <ul style={{ listStyle: "none", margin: "18px 0 0", padding: 0, display: "grid", gap: 10 }}>
                {cover.benefits.map((b, i) => (
                  <li key={i} style={benefitRow}>
                    <span style={checkDot(accent)}>✓</span>
                    <span style={{ fontSize: 14, color: "#374151" }}>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <button style={primaryBtn(accent)} onClick={() => setIdx(0)}>
              Пройти квиз
            </button>
          </div>
        )}

        {/* Вопросы */}
        {idx >= 0 && idx < steps.length && (
          <div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
              Вопрос {idx + 1} из {steps.length}
            </div>
            <div style={questionText}>{steps[idx].question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {(steps[idx].options?.length ? steps[idx].options : ["Далее"])!.map((opt, i) => (
                <button
                  key={i}
                  style={optionBtn}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = accent)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                  onClick={() => pick(steps[idx].question, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {idx > 0 && (
              <button style={backBtn} onClick={() => setIdx((i) => i - 1)}>
                ← Назад
              </button>
            )}
          </div>
        )}

        {/* Форма контактов */}
        {idx >= steps.length && !done && (
          <div>
            <div style={questionText}>{contact?.title || "Оставьте контакты"}</div>
            {contact?.bonus && (
              <div style={bonusPill(accent)}>🎁 {contact.bonus}</div>
            )}
            <input
              style={inputStyle}
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Телефон"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="E-mail (необязательно)"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</div>}
            <button style={primaryBtn(accent)} onClick={submit} disabled={sending}>
              {sending ? "Отправляем…" : "Получить результат"}
            </button>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных
            </p>
          </div>
        )}

        {/* Спасибо */}
        {done && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 44 }}>✅</div>
            <div style={{ ...questionText, marginTop: 8 }}>Заявка отправлена!</div>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
              Спасибо! Мы свяжемся с вами в ближайшее время.
            </p>
          </div>
        )}
      </div>

      <a href="https://qvalify.ru" target="_blank" rel="noreferrer" style={madeWith}>
        Сделано на Квалифай
      </a>
    </main>
  );
}

/* ── стили ──────────────────────────────────────────────── */
const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  padding: 20,
  background: "#E8EDF6",
  fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif",
};
const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 440,
  background: "#fff",
  borderRadius: 20,
  boxShadow: "0 12px 40px rgba(17,24,39,.12)",
  padding: 28,
  boxSizing: "border-box",
};
const barStyle: CSSProperties = {
  height: 5,
  background: "#eceef2",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 20,
};
const fillStyle: CSSProperties = { height: "100%", borderRadius: 999, transition: "width .3s ease" };
const coverTitle: CSSProperties = { fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", color: "#111827", margin: 0 };
const coverSub: CSSProperties = { fontSize: 15, color: "#6b7280", marginTop: 8 };
const questionText: CSSProperties = { fontSize: 18, fontWeight: 600, letterSpacing: "-.01em", color: "#111827" };
const optionBtn: CSSProperties = {
  textAlign: "left",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "13px 15px",
  fontSize: 14,
  background: "#fff",
  cursor: "pointer",
  fontFamily: "inherit",
  color: "#111827",
  transition: "border-color .15s",
};
const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  marginTop: 10,
  fontFamily: "inherit",
  color: "#111827",
  outline: "none",
};
const backBtn: CSSProperties = {
  marginTop: 16,
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: 0,
};
const madeWith: CSSProperties = { fontSize: 12, color: "#9ca3af", textDecoration: "none" };
const benefitRow: CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

function primaryBtn(accent: string): CSSProperties {
  return {
    width: "100%",
    marginTop: 20,
    background: accent,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
function logoDot(accent: string): CSSProperties {
  return { width: 22, height: 22, borderRadius: 7, background: accent, display: "inline-block" };
}
function checkDot(accent: string): CSSProperties {
  return {
    flex: "0 0 auto",
    width: 20,
    height: 20,
    borderRadius: 999,
    background: accent,
    color: "#fff",
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}
function bonusPill(accent: string): CSSProperties {
  return {
    display: "inline-block",
    marginTop: 12,
    padding: "6px 12px",
    borderRadius: 999,
    background: `${accent}14`,
    color: accent,
    fontSize: 13,
    fontWeight: 600,
  };
}
