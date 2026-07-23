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
  const [consent, setConsent] = useState(false);

  const sessionRef = useRef("");
  const trackedRef = useRef<Set<string>>(new Set());
  const cardRef = useRef<HTMLDivElement>(null);
  const [freeScale, setFreeScale] = useState(1);
  useEffect(() => { sessionRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36); }, []);

  // Свободное размещение свёрстано под ширину окна из редактора. На узком
  // экране масштабируем весь слой блоков, чтобы не было переполнения.
  useEffect(() => {
    const c = withCard(doc);
    const isFree = steps[i]?.layout === "free";
    const el = cardRef.current;
    if (!isFree || !el) { setFreeScale(1); return; }
    const contentW = c.width - c.padX * 2;
    const measure = () => {
      const avail = el.clientWidth - c.padX * 2;
      setFreeScale(contentW > 0 ? Math.min(1, avail / contentW) : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [i, doc, steps]);

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
      // Свой JS владельца квиза выполняем ТОЛЬКО в песочнице (sandboxed iframe
      // без allow-same-origin): нет доступа к cookie/DOM нашего origin — защита
      // посетителей от вредоносного кода тенанта (см. аудит C2).
      runSandboxedJs(step.js, { step: i, quiz: { slug: quiz.slug, name: quiz.name } });
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
    if (!consent) { setError("Подтвердите согласие на обработку персональных данных"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: quiz.slug, name: contact.name, phone: contact.phone, email: contact.email, answers, source: "прямая ссылка", finished: true, utm: collectUtm() }),
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
  const contentW = card.width - card.padX * 2;

  const progress = Math.round((i / Math.max(1, steps.length - 1)) * 100);

  const cardStyleDyn: CSSProperties = {
    width: "100%", maxWidth: card.width, background: "#fff", borderRadius: card.radius,
    boxShadow: "0 12px 40px rgba(17,24,39,.12)", padding: `${card.padY}px ${card.padX}px`, boxSizing: "border-box",
    minHeight: free ? stageH : card.minHeight || undefined,
  };

  return (
    <main style={{ ...pageStyle, fontFamily: FONTS[doc.theme.font] || FONTS.system }}>
      {settings.discount?.enabled && !done && <DiscountBar discount={settings.discount} slug={quiz.slug} />}
      <div ref={cardRef} style={{ ...cardStyleDyn, ...cardBg }}>
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
          <div key={i} style={{ animation: slideKf ? `${slideKf} .42s cubic-bezier(.2,.8,.3,1)` : undefined, position: free ? "relative" : undefined, height: free ? (contentH || 0) * freeScale : undefined }}>
            {free ? (
              <div style={{ position: "absolute", top: 0, left: 0, width: contentW, height: contentH, transform: freeScale !== 1 ? `scale(${freeScale})` : undefined, transformOrigin: "top left" }}>
                {step.blocks.map((b, idx) => {
                  const view = <BlockView block={b} accent={accent} free contact={contact} setContact={setContact} onPick={pickOption} onButton={() => (step.kind === "contact" ? submit(b.goal) : (fireGoal(b.goal), advance()))} sending={sending} />;
                  const p = b.pos || { x: 0, y: idx * 70, w: contentW };
                  const isMedia = b.type === "image" || b.type === "slider";
                  const wrapH = p.h ?? (isMedia ? (b.style.height || 160) : undefined);
                  return <div key={b.id} style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: wrapH }}>{view}</div>;
                })}
              </div>
            ) : step.blocks.map((b) => {
              const view = <BlockView block={b} accent={accent} free={false} contact={contact} setContact={setContact} onPick={pickOption} onButton={() => (step.kind === "contact" ? submit(b.goal) : (fireGoal(b.goal), advance()))} sending={sending} />;
              return <div key={b.id}>{view}</div>;
            })}
            {step.kind === "contact" && (
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "#6b7280", lineHeight: 1.45, marginTop: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 15, height: 15, marginTop: 1, accentColor: accent, flexShrink: 0, cursor: "pointer" }} />
                <span>Согласен на обработку персональных данных и с <a href="https://qvalify.ru/dokumenty#policy" target="_blank" rel="noreferrer" style={{ color: accent }}>политикой конфиденциальности</a></span>
              </label>
            )}
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
  const isMedia = block.type === "image" || block.type === "slider";
  const outer: CSSProperties = free
    ? { display: "flex", justifyContent: s.align === "left" ? "flex-start" : s.align === "right" ? "flex-end" : "center", ...(isMedia ? { height: "100%" } : {}) }
    : { marginTop: s.marginTop, display: "flex", justifyContent: s.align === "left" ? "flex-start" : s.align === "right" ? "flex-end" : "center" };
  const innerWidth = free ? "100%" : `${s.width}%`;
  const mediaH = free ? "100%" : undefined;
  const css = blockCss(s) as CSSProperties;

  if (block.type === "heading" || block.type === "text") {
    return (
      <div style={outer}>
        <div style={{ ...css, width: innerWidth, textAlign: s.align, whiteSpace: "pre-wrap" }}>{block.text}</div>
      </div>
    );
  }
  if (block.type === "slider") {
    return <div style={outer}><SliderBlock images={block.images || []} width={innerWidth} height={mediaH ?? (s.height || 200)} radius={s.radius} /></div>;
  }
  if (block.type === "image") {
    return (
      <div style={outer}>
        {block.src
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={block.src} alt="" style={{ width: innerWidth, height: mediaH ?? (s.height || "auto"), objectFit: "cover", borderRadius: s.radius, marginTop: 0, display: "block", border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor}` : "none" }} />
          : <div style={{ width: innerWidth, height: mediaH ?? (s.height || 160), borderRadius: s.radius, background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>Картинка</div>}
      </div>
    );
  }
  if (block.type === "html") {
    // Авторский HTML — только в песочнице (sandboxed iframe), не на нашем origin (аудит C1).
    return <div style={{ ...outer }}><div style={{ width: innerWidth }}><SandboxHtml html={block.html || ""} height={s.height || (free ? "100%" : 160)} /></div></div>;
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

// Тающая скидка: таймер обратного отсчёта над окном квиза.
// Дедлайн фиксируется в localStorage на посетителя — не сбрасывается при обновлении.
function DiscountBar({ discount, slug }: { discount: NonNullable<QuizDoc["settings"]>["discount"]; slug: string }) {
  const d = discount!;
  const [left, setLeft] = useState(d.minutes * 60);
  useEffect(() => {
    const key = `qv_disc_${slug}`;
    let deadline = 0;
    try {
      const saved = Number(localStorage.getItem(key));
      if (saved && saved > Date.now()) deadline = saved;
    } catch { /* ignore */ }
    if (!deadline) {
      deadline = Date.now() + d.minutes * 60 * 1000;
      try { localStorage.setItem(key, String(deadline)); } catch { /* ignore */ }
    }
    const tick = () => setLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [slug, d.minutes]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: d.bg, color: d.color, borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(15,31,60,0.18)", maxWidth: "100%", boxSizing: "border-box", flexWrap: "wrap", justifyContent: "center" }}>
      <span>{d.text}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", background: "rgba(255,255,255,0.18)", borderRadius: 8, padding: "4px 9px", letterSpacing: 0.5 }}>{mm}:{ss}</span>
    </div>
  );
}

// Безопасное исполнение авторского HTML: sandbox-iframe (null-origin), без доступа
// к cookie/DOM платформы. allow-scripts даёт скриптам работать, но allow-same-origin
// НЕ включаем — иначе песочница бесполезна.
function SandboxHtml({ html, height }: { html: string; height: number | string }) {
  const doc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}</style></head><body>${html}</body></html>`;
  return (
    <iframe
      title="Пользовательский HTML"
      sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
      srcDoc={doc}
      style={{ width: "100%", height, border: "none", display: "block" }}
    />
  );
}

// Безопасное исполнение авторского JS: скрытый sandbox-iframe (null-origin).
// Код тенанта не может читать cookie/DOM нашего origin (аудит C2).
function runSandboxedJs(code: string, ctx: { step: number; quiz: { slug: string; name: string } }) {
  try {
    const ctxJson = JSON.stringify(ctx).replace(/</g, "\\u003c");
    const body = `<!doctype html><html><body><script>(function(){try{var __c=${ctxJson};var step=__c.step;var quiz=__c.quiz;\n${code}\n}catch(e){}})();<\/script></body></html>`;
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;width:0;height:0;border:0;left:-9999px;visibility:hidden";
    frame.srcdoc = body;
    document.body.appendChild(frame);
    setTimeout(() => { frame.remove(); }, 15000);
  } catch { /* ignore */ }
}

// Скрытые поля: собираем UTM-метки, рекламные id и реферер (сквозная аналитика)
function collectUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "yclid", "fbclid"]) {
      const v = p.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
    if (document.referrer) out.referrer = document.referrer.slice(0, 300);
    out.page = window.location.href.slice(0, 300);
  } catch { /* ignore */ }
  return out;
}

function SliderBlock({ images, width, height, radius }: { images: string[]; width: string; height: number | string; radius: number }) {
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
