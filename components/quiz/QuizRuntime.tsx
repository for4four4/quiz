"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ANIM_KEYFRAME, blockCss, FONTS, withCard, withSettings, type Block, type QuizDoc } from "@/lib/quiz/doc";

export type PublicQuiz = {
  slug: string;
  name: string;
  doc: QuizDoc;
  metrikaCounter?: string;
};

type Ym = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };

export default function QuizRuntime({ quiz }: { quiz: PublicQuiz }) {
  const doc = quiz.doc;
  const steps = doc.steps;
  const accent = doc.theme.accent || "#28559c";
  const settings = withSettings(doc);
  const slideKf = ANIM_KEYFRAME[settings.slideAnim];
  const progressColor = settings.display.progressColor || accent;

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
  const [contact, setContact] = useState<{ name: string; phone: string; email: string }>({ name: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const sessionRef = useRef("");
  const trackedRef = useRef<Set<string>>(new Set());
  useEffect(() => { sessionRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36); }, []);

  // Индекс текущего шага среди вопросов (для воронки)
  const questionIndex = useMemo(() => {
    let n = -1;
    for (let k = 0; k <= i && k < steps.length; k++) if (steps[k].kind === "question") n++;
    return n;
  }, [i, steps]);

  // ── Яндекс.Метрика ──────────────────────────────────────
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

  // Цель: Метрика reachGoal + dataLayer (GTM/коллтрекинг могут слушать)
  const fireGoal = (name?: string) => {
    if (!name || typeof window === "undefined") return;
    const w = window as unknown as { ym?: Ym; dataLayer?: unknown[] };
    if (quiz.metrikaCounter && w.ym) w.ym(Number(quiz.metrikaCounter), "reachGoal", name);
    (w.dataLayer = w.dataLayer || []).push({ event: name, quiz: quiz.slug });
  };

  // Событие воронки (best-effort)
  const trackEvent = (type: "open" | "step" | "contact", step?: number) => {
    const key = type === "step" ? `step${step}` : type;
    if (trackedRef.current.has(key)) return;
    trackedRef.current.add(key);
    try {
      fetch("/api/public/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: quiz.slug, type, step, source: "прямая ссылка", session: sessionRef.current }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  useEffect(() => { trackEvent("open"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Переадресация после успешной заявки (если настроена)
  useEffect(() => {
    if (!done) return;
    const url = settings.thanks?.redirectUrl;
    if (!url || !/^https?:\/\//.test(url)) return;
    const t = setTimeout(() => { window.location.href = url; }, Math.max(0, settings.thanks?.redirectSec ?? 3) * 1000);
    return () => clearTimeout(t);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  // На каждый показ шага: воронка + цель шага + свой JS
  useEffect(() => {
    const step = steps[i];
    if (!step) return;
    if (step.kind === "question") trackEvent("step", Math.max(0, questionIndex));
    else if (step.kind === "contact") trackEvent("contact");
    fireGoal(step.goal);
    if (step.js && typeof window !== "undefined") {
      try {
        // Свой код владельца квиза (как «свой JS» в Tilda). Изолируем в функции.
        new Function("step", "quiz", step.js)(i, { slug: quiz.slug, name: quiz.name });
      } catch (e) {
        console.error("Ошибка своего JS на шаге", e);
      }
    }
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[i];
  if (!step) return null;

  const stepHeading = () => step.blocks.find((b) => b.type === "heading")?.text || step.title || "Вопрос";
  const advance = () => setI((v) => Math.min(steps.length - 1, v + 1));

  // Ветвление: переход на конкретный шаг по id (или следующий)
  const goTo = (targetId?: string) => {
    if (targetId) {
      const idx = steps.findIndex((s) => s.id === targetId);
      if (idx >= 0) { setI(idx); return; }
    }
    advance();
  };

  const pickOption = (opt: string, goal?: string, targetId?: string) => {
    if (step.kind === "question") setAnswers((prev) => [...prev.filter((p) => p.q !== stepHeading()), { q: stepHeading(), a: opt }]);
    fireGoal(goal);
    goTo(targetId);
  };

  async function submit(goal?: string) {
    setError("");
    fireGoal(goal);
    if (!contact.phone.trim()) { setError("Укажите телефон"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: quiz.slug, name: contact.name, phone: contact.phone, email: contact.email, answers, source: "прямая ссылка", finished: true }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Не удалось отправить");
      fireGoal("quiz_lead");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  }

  const cardBg = step.bg?.type === "image" && step.bg.value
    ? { backgroundImage: `url(${step.bg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: step.bg?.value || doc.theme.bg || "#ffffff" };

  const card = withCard(doc);
  const free = step.layout === "free";
  const stageH = free ? Math.max(240, card.minHeight || 480) : undefined;
  const contentH = stageH ? stageH - card.padY * 2 : undefined;

  const progress = Math.round((i / Math.max(1, steps.length - 1)) * 100);

  const cardStyleDyn: CSSProperties = {
    width: "100%", maxWidth: card.width, background: "#fff", borderRadius: card.radius,
    boxShadow: "0 12px 40px rgba(17,24,39,.12)", padding: `${card.padY}px ${card.padX}px`, boxSizing: "border-box",
    minHeight: free ? stageH : card.minHeight || undefined,
  };

  return (
    <main style={{ ...pageStyle, fontFamily: FONTS[doc.theme.font] || FONTS.system }}>
      <div style={{ ...cardStyleDyn, ...cardBg }}>
        {settings.display.progressOn && (
          <div style={barStyle}><div style={{ ...fillStyle, width: `${progress}%`, background: progressColor }} /></div>
        )}

        {done ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 44 }}>{settings.thanks?.emoji || "✅"}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8, color: "#111827" }}>{settings.thanks?.title || "Заявка отправлена!"}</div>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, whiteSpace: "pre-wrap" }}>{settings.thanks?.text || "Спасибо! Мы свяжемся с вами в ближайшее время."}</p>
            {!!settings.thanks?.redirectUrl && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10 }}>Сейчас перенаправим…</p>}
          </div>
        ) : (
          <div key={i} style={{ animation: slideKf ? `${slideKf} .42s cubic-bezier(.2,.8,.3,1)` : undefined, position: free ? "relative" : undefined, height: free ? contentH : undefined }}>
            {step.blocks.map((b, idx) => {
              const view = <BlockView block={b} accent={accent} free={free} contact={contact} setContact={setContact} onPick={pickOption} onButton={() => (step.kind === "contact" ? submit(b.goal) : (fireGoal(b.goal), advance()))} sending={sending} />;
              if (!free) return <div key={b.id}>{view}</div>;
              const p = b.pos || { x: 0, y: idx * 70, w: card.width - card.padX * 2 };
              return <div key={b.id} style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h }}>{view}</div>;
            })}
            {step.kind === "contact" && error && <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</div>}
          </div>
        )}
      </div>
      {!settings.hideBadge && <a href="https://qvalify.ru" target="_blank" rel="noreferrer" style={madeWith}>Сделано на Квалифай</a>}
    </main>
  );
}

function BlockView({ block, accent, free, contact, setContact, onPick, onButton, sending }: {
  block: Block;
  accent: string;
  free?: boolean;
  contact: { name: string; phone: string; email: string };
  setContact: (f: (c: { name: string; phone: string; email: string }) => { name: string; phone: string; email: string }) => void;
  onPick: (opt: string, goal?: string, targetId?: string) => void;
  onButton: () => void;
  sending: boolean;
}) {
  const s = block.style;
  const outer: CSSProperties = free
    ? { display: "flex", justifyContent: s.align === "left" ? "flex-start" : s.align === "right" ? "flex-end" : "center" }
    : { marginTop: s.marginTop, display: "flex", justifyContent: s.align === "left" ? "flex-start" : s.align === "right" ? "flex-end" : "center" };
  const innerWidth = free ? "100%" : `${s.width}%`;
  const css = blockCss(s) as CSSProperties;

  if (block.type === "heading" || block.type === "text") {
    return (
      <div style={outer}>
        <div style={{ ...css, width: innerWidth, textAlign: s.align, whiteSpace: "pre-wrap" }}>{block.text}</div>
      </div>
    );
  }
  if (block.type === "slider") {
    return <div style={outer}><SliderBlock images={block.images || []} width={innerWidth} height={s.height || 200} radius={s.radius} /></div>;
  }
  if (block.type === "image") {
    return (
      <div style={outer}>
        {block.src
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={block.src} alt="" style={{ width: innerWidth, height: s.height || (free ? "100%" : "auto"), objectFit: "cover", borderRadius: s.radius, marginTop: 0, border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor}` : "none" }} />
          : <div style={{ width: innerWidth, height: s.height || 160, borderRadius: s.radius, background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>Картинка</div>}
      </div>
    );
  }
  if (block.type === "html") {
    return <div style={{ ...outer }}><div style={{ width: innerWidth }} dangerouslySetInnerHTML={{ __html: block.html || "" }} /></div>;
  }
  if (block.type === "button") {
    return (
      <div style={outer}>
        <button onClick={onButton} disabled={sending} style={{ ...css, width: innerWidth, cursor: "pointer", border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor}` : "none", opacity: sending ? 0.7 : 1 }}>
          {sending ? "Отправляем…" : block.text}
        </button>
      </div>
    );
  }
  if (block.type === "input") {
    const field = block.field || "text";
    const val = field === "name" ? contact.name : field === "phone" ? contact.phone : field === "email" ? contact.email : "";
    return (
      <div style={outer}>
        <input
          value={field === "text" ? undefined : val}
          placeholder={block.placeholder}
          inputMode={field === "phone" ? "tel" : field === "email" ? "email" : "text"}
          onChange={(e) => { if (field !== "text") setContact((c) => ({ ...c, [field]: e.target.value })); }}
          style={{ ...css, width: innerWidth, outline: "none", fontFamily: FONTS[s.font] || FONTS.system }}
        />
      </div>
    );
  }
  // options
  return (
    <div style={outer}>
      <div style={{ width: innerWidth, display: "flex", flexDirection: "column", gap: 8 }}>
        {(block.options || []).map((opt, k) => (
          <button
            key={k}
            onClick={() => onPick(opt, block.goal, block.targets?.[k])}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = accent)}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = s.borderColor || "#e5e7eb")}
            style={{ textAlign: "left", border: `1px solid ${s.borderColor || "#e5e7eb"}`, borderRadius: s.radius || 12, padding: "13px 15px", fontSize: s.fontSize, background: s.bg === "transparent" ? "#fff" : s.bg, color: s.color, cursor: "pointer", fontFamily: FONTS[s.font] || FONTS.system, transition: "border-color .15s" }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderBlock({ images, width, height, radius }: { images: string[]; width: string; height: number; radius: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx((v) => (v + 1) % images.length), 3500);
    return () => clearInterval(t);
  }, [images.length]);
  if (!images.length) return <div style={{ width, height, borderRadius: radius, background: "#eef1f6" }} />;
  const go = (d: number) => setIdx((v) => (v + d + images.length) % images.length);
  return (
    <div style={{ width, height, borderRadius: radius, overflow: "hidden", position: "relative", background: "#000" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity .3s" }} />
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} style={arrowBtn("left")}>‹</button>
          <button onClick={() => go(1)} style={arrowBtn("right")}>›</button>
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
            {images.map((_, k) => (
              <span key={k} onClick={() => setIdx(k)} style={{ width: 7, height: 7, borderRadius: 999, cursor: "pointer", background: k === idx ? "#fff" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function arrowBtn(side: "left" | "right"): CSSProperties {
  return { position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 8, width: 30, height: 30, borderRadius: 999, border: "none", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } as CSSProperties;
}

const pageStyle: CSSProperties = { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20, background: "#E8EDF6" };
const barStyle: CSSProperties = { height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 999, overflow: "hidden", marginBottom: 4 };
const fillStyle: CSSProperties = { height: "100%", borderRadius: 999, transition: "width .3s ease" };
const madeWith: CSSProperties = { fontSize: 12, color: "#9ca3af", textDecoration: "none" };
