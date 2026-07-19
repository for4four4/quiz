"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { routes } from "@/lib/nav";
import { api, type QuizDesign, type QuizStep } from "@/lib/client/api";

type Cover = { title: string; subtitle: string; benefits: string[] };
type Contact = { title: string; bonus: string };
type Sel = number; // -1 = обложка · 0..n-1 = вопросы · steps.length = контакты

const ACCENTS = ["#28559c", "#0F1F3C", "#166534", "#c2410c", "#7c3aed", "#111827"];
const BGS = ["#ffffff", "#fafafa", "#f0f4fa", "#e8edf6", "#0F1F3C", "#111827"];

function normSteps(raw: QuizStep[]): { question: string; options: string[] }[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((s) => s && typeof s.question === "string")
    .map((s) => ({ question: s.question || "", options: Array.isArray(s.options) ? s.options.filter(Boolean) : [] }));
}

export function EditorApp() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Новый квиз");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [cover, setCover] = useState<Cover>({ title: "Рассчитайте стоимость за 1 минуту", subtitle: "Ответьте на пару вопросов — получите точный расчёт и бонус", benefits: ["Бесплатно", "Быстро", "Точный расчёт"] });
  const [steps, setSteps] = useState<{ question: string; options: string[] }[]>([{ question: "Что вас интересует?", options: ["Вариант 1", "Вариант 2"] }]);
  const [contact, setContact] = useState<Contact>({ title: "Оставьте контакты", bonus: "Скидка 10%" });
  const [accent, setAccent] = useState("#28559c");
  const [bg, setBg] = useState("#ffffff");
  const [sel, setSel] = useState<Sel>(-1);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [dirty, setDirty] = useState(false);

  const idRef = useRef<string | null>(null);
  const designExtraRef = useRef<QuizDesign>({});
  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setLoading(false); return; }
    idRef.current = id;
    api.quiz(id)
      .then(({ quiz }) => {
        setName(quiz.name);
        setSlug(quiz.slug);
        setStatus(quiz.status);
        const ns = normSteps(quiz.steps);
        if (ns.length) setSteps(ns);
        const d = quiz.design || {};
        designExtraRef.current = d;
        if (d.cover) setCover({ title: d.cover.title || "", subtitle: d.cover.subtitle || "", benefits: d.cover.benefits || [] });
        if (d.contactForm) setContact({ title: d.contactForm.title || "Оставьте контакты", bonus: d.contactForm.bonus || "" });
        if (d.accent) setAccent(d.accent);
        if (d.bg) setBg(d.bg);
      })
      .catch(() => { /* демо-режим */ })
      .finally(() => setLoading(false));
  }, []);

  const touch = () => setDirty(true);

  // ── мутации ─────────────────────────────────────────────
  const setStep = (i: number, patch: Partial<{ question: string; options: string[] }>) => {
    setSteps((s) => s.map((st, j) => (j === i ? { ...st, ...patch } : st))); touch();
  };
  const addQuestion = () => {
    setSteps((s) => [...s, { question: "Новый вопрос", options: ["Вариант 1", "Вариант 2"] }]);
    setSel(steps.length); touch();
  };
  const removeQuestion = (i: number) => {
    if (steps.length <= 1) { alert("В квизе должен остаться хотя бы один вопрос."); return; }
    setSteps((s) => s.filter((_, j) => j !== i));
    setSel((cur) => (cur >= steps.length - 1 ? steps.length - 2 : cur)); touch();
  };
  const moveQuestion = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= steps.length) return;
    setSteps((s) => { const n = [...s]; [n[i], n[to]] = [n[to], n[i]]; return n; });
    setSel(to); touch();
  };
  const dropQuestion = (to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === to) return;
    setSteps((s) => { const n = [...s]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    setSel(to); touch();
  };

  const setOption = (si: number, oi: number, v: string) => setStep(si, { options: steps[si].options.map((o, j) => (j === oi ? v : o)) });
  const addOption = (si: number) => setStep(si, { options: [...steps[si].options, `Вариант ${steps[si].options.length + 1}`] });
  const removeOption = (si: number, oi: number) => { if (steps[si].options.length <= 1) return; setStep(si, { options: steps[si].options.filter((_, j) => j !== oi) }); };

  const setBenefit = (i: number, v: string) => { setCover((c) => ({ ...c, benefits: c.benefits.map((b, j) => (j === i ? v : b)) })); touch(); };
  const addBenefit = () => { setCover((c) => ({ ...c, benefits: [...c.benefits, "Новое преимущество"] })); touch(); };
  const removeBenefit = (i: number) => { setCover((c) => ({ ...c, benefits: c.benefits.filter((_, j) => j !== i) })); touch(); };

  // ── сохранение ──────────────────────────────────────────
  const persist = async (): Promise<string | null> => {
    setSaving(true);
    const design: QuizDesign = {
      ...designExtraRef.current,
      cover: { title: cover.title, subtitle: cover.subtitle, benefits: cover.benefits },
      contactForm: { title: contact.title, bonus: contact.bonus },
      accent,
      bg,
    };
    try {
      if (idRef.current) {
        const { quiz } = await api.updateQuiz(idRef.current, { name, steps, design });
        setSlug(quiz.slug); setStatus(quiz.status);
        designExtraRef.current = quiz.design || design;
      } else {
        const { quiz } = await api.createQuiz({ name, steps, design });
        idRef.current = quiz.id; setSlug(quiz.slug); setStatus(quiz.status);
        designExtraRef.current = quiz.design || design;
        if (typeof window !== "undefined") window.history.replaceState(null, "", `${routes.editor}?id=${quiz.id}`);
      }
      setSavedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      setDirty(false);
      return idRef.current;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось сохранить");
      return null;
    } finally {
      setSaving(false);
    }
  };
  const publish = async () => {
    const id = await persist();
    if (!id) return;
    const next = status === "active" ? "draft" : "active";
    try {
      const { quiz } = await api.updateQuiz(id, { status: next });
      setStatus(quiz.status); setSlug(quiz.slug);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка публикации");
    }
  };
  const preview = () => {
    if (status === "active" && slug) window.open(`/q/${slug}`, "_blank");
    else alert("Опубликуйте квиз, чтобы открыть публичную ссылку.");
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFEFEF", color: "#6b7280", fontSize: 14, fontFamily: "-apple-system,Segoe UI,Arial,sans-serif" }}>Загружаем редактор…</div>;
  }

  const stepList: { key: Sel; label: string; sub: string }[] = [
    { key: -1, label: "Обложка", sub: cover.title || "Стартовый экран" },
    ...steps.map((s, i) => ({ key: i as Sel, label: `Вопрос ${i + 1}`, sub: s.question || "—" })),
    { key: steps.length, label: "Контакты", sub: contact.title || "Форма заявки" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#EFEFEF", color: "#111827", overflow: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif" }}>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e9e9e9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
          <Link href={routes.cabinet} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 14px", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>Кабинет
          </Link>
          <input value={name} onChange={(e) => { setName(e.target.value); touch(); }} style={{ fontSize: 14, fontWeight: 600, border: "1px solid transparent", borderRadius: 8, padding: "6px 8px", minWidth: 0, maxWidth: 320, fontFamily: "inherit", background: "transparent" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")} />
          <div style={{ fontSize: 11.5, color: dirty ? "#c2410c" : "#9ca3af", whiteSpace: "nowrap" }}>{dirty ? "Есть несохранённые изменения" : savedAt ? `Сохранено в ${savedAt}` : status === "active" ? "Опубликован" : "Черновик"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div onClick={preview} style={btnGhost}>Предпросмотр</div>
          <div onClick={() => persist()} style={{ ...btnGhost, opacity: saving ? 0.6 : 1 }}>{saving ? "Сохраняем…" : "Сохранить"}</div>
          <div onClick={publish} style={{ background: status === "active" ? "#111827" : "#28559c", color: "#fff", borderRadius: 9999, padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>{status === "active" ? "Снять с публикации" : "Опубликовать"}</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left: steps */}
        <div style={{ width: 236, flexShrink: 0, background: "#fff", borderRight: "1px solid #e9e9e9", overflowY: "auto", padding: "16px 12px", boxSizing: "border-box" }}>
          <div style={panelLabel}>Шаги квиза</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stepList.map((item, listIdx) => {
              const active = sel === item.key;
              const isQuestion = typeof item.key === "number" && item.key >= 0 && item.key < steps.length;
              return (
                <div
                  key={listIdx}
                  onClick={() => setSel(item.key)}
                  draggable={isQuestion}
                  onDragStart={() => { if (isQuestion) dragFrom.current = item.key as number; }}
                  onDragOver={(e) => { if (isQuestion) e.preventDefault(); }}
                  onDrop={() => { if (isQuestion) dropQuestion(item.key as number); }}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 12, cursor: "pointer", background: active ? "rgba(40,85,156,0.09)" : "transparent", border: "1px solid " + (active ? "rgba(40,85,156,0.25)" : "transparent") }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: active ? "#28559c" : "#f3f4f6", color: active ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.key === -1 ? "◎" : item.key === steps.length ? "✎" : (item.key as number) + 1}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: active ? "#28559c" : "#374151" }}>{item.label}</span>
                    <span style={{ display: "block", fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.sub}</span>
                  </span>
                  {isQuestion && <span style={{ color: "#c4c8cf", fontSize: 13, cursor: "grab" }}>⠿</span>}
                </div>
              );
            })}
            <div onClick={addQuestion} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 10px", borderRadius: 12, fontSize: 12.5, fontWeight: 500, cursor: "pointer", color: "#28559c", border: "1px dashed rgba(40,85,156,0.4)", marginTop: 4 }}>+ Добавить вопрос</div>
          </div>
        </div>

        {/* Center: canvas */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "36px 24px" }}>
          <div style={{ background: bg, borderRadius: 20, boxShadow: "0 12px 40px rgba(17,24,39,0.10)", width: 460, maxWidth: "100%", padding: 32, boxSizing: "border-box" }}>
            <ProgressPreview accent={accent} sel={sel} total={steps.length + 1} />

            {sel === -1 && (
              <div style={{ marginTop: 18 }}>
                <CanvasInput value={cover.title} onChange={(v) => { setCover((c) => ({ ...c, title: v })); touch(); }} placeholder="Заголовок обложки" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: darkOn(bg) }} />
                <CanvasInput value={cover.subtitle} onChange={(v) => { setCover((c) => ({ ...c, subtitle: v })); touch(); }} placeholder="Подзаголовок" style={{ fontSize: 15, color: mutedOn(bg), marginTop: 4 }} />
                <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                  {cover.benefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 999, background: accent, color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                      <CanvasInput value={b} onChange={(v) => setBenefit(i, v)} placeholder="Преимущество" style={{ fontSize: 14, color: darkOn(bg) }} />
                      <RemoveBtn onClick={() => removeBenefit(i)} />
                    </div>
                  ))}
                  <div onClick={addBenefit} style={addRow}>+ Преимущество</div>
                </div>
                <div style={{ marginTop: 20, background: accent, color: "#fff", borderRadius: 12, padding: "14px 16px", fontSize: 15, fontWeight: 600, textAlign: "center" }}>Пройти квиз</div>
              </div>
            )}

            {typeof sel === "number" && sel >= 0 && sel < steps.length && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, color: mutedOn(bg), marginBottom: 6 }}>Вопрос {sel + 1} из {steps.length}</div>
                <CanvasInput value={steps[sel].question} onChange={(v) => setStep(sel, { question: v })} placeholder="Текст вопроса" style={{ fontSize: 18, fontWeight: 600, color: darkOn(bg) }} />
                <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                  {steps[sel].options.map((o, oi) => (
                    <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 10px", background: "#fff" }}>
                      <span style={{ color: "#c4c8cf", fontSize: 12 }}>○</span>
                      <CanvasInput value={o} onChange={(v) => setOption(sel, oi, v)} placeholder={`Вариант ${oi + 1}`} style={{ fontSize: 14, color: "#111827" }} />
                      <RemoveBtn onClick={() => removeOption(sel, oi)} />
                    </div>
                  ))}
                  <div onClick={() => addOption(sel)} style={addRow}>+ Вариант ответа</div>
                </div>
              </div>
            )}

            {sel === steps.length && (
              <div style={{ marginTop: 18 }}>
                <CanvasInput value={contact.title} onChange={(v) => { setContact((c) => ({ ...c, title: v })); touch(); }} placeholder="Заголовок формы" style={{ fontSize: 18, fontWeight: 600, color: darkOn(bg) }} />
                <div style={{ marginTop: 8, display: "inline-block", padding: "6px 12px", borderRadius: 999, background: `${accent}22`, color: accent, fontSize: 13, fontWeight: 600 }}>
                  🎁 <input value={contact.bonus} onChange={(e) => { setContact((c) => ({ ...c, bonus: e.target.value })); touch(); }} placeholder="Бонус" style={{ border: "none", background: "transparent", color: accent, fontWeight: 600, fontSize: 13, fontFamily: "inherit", outline: "none", width: 140 }} />
                </div>
                {["Ваше имя", "Телефон", "E-mail (необязательно)"].map((ph) => (
                  <div key={ph} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#9ca3af", marginTop: 10, background: "#fff" }}>{ph}</div>
                ))}
                <div style={{ marginTop: 14, background: accent, color: "#fff", borderRadius: 12, padding: "14px 16px", fontSize: 15, fontWeight: 600, textAlign: "center" }}>Получить результат</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: inspector */}
        <div style={{ width: 264, flexShrink: 0, background: "#fff", borderLeft: "1px solid #e9e9e9", overflowY: "auto", padding: "18px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
              {sel === -1 ? "Обложка" : sel === steps.length ? "Форма контактов" : `Вопрос ${(sel as number) + 1}`}
            </div>
            <div style={{ fontSize: 11.5, color: "#9ca3af" }}>Редактируйте текст прямо на холсте</div>
          </div>

          {typeof sel === "number" && sel >= 0 && sel < steps.length && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
              <div style={panelLabel}>Порядок вопроса</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div onClick={() => moveQuestion(sel, -1)} style={{ ...miniBtn, opacity: sel === 0 ? 0.4 : 1 }}>↑ Выше</div>
                <div onClick={() => moveQuestion(sel, 1)} style={{ ...miniBtn, opacity: sel === steps.length - 1 ? 0.4 : 1 }}>↓ Ниже</div>
              </div>
              <div onClick={() => removeQuestion(sel)} style={{ ...miniBtn, color: "#991b1b", borderColor: "rgba(153,27,27,0.3)", justifyContent: "center" }}>Удалить вопрос</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
            <div style={panelLabel}>Акцентный цвет</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ACCENTS.map((c) => (
                <span key={c} onClick={() => { setAccent(c); touch(); }} style={{ width: 26, height: 26, borderRadius: 999, cursor: "pointer", background: c, boxSizing: "border-box", outline: accent === c ? "2px solid #28559c" : "1px solid #e5e7eb", outlineOffset: 2 }} />
              ))}
            </div>
            <div style={panelLabel}>Фон квиза</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BGS.map((c) => (
                <span key={c} onClick={() => { setBg(c); touch(); }} style={{ width: 26, height: 26, borderRadius: 8, cursor: "pointer", background: c, boxSizing: "border-box", outline: bg === c ? "2px solid #28559c" : "1px solid #e5e7eb", outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: "#9ca3af", lineHeight: 1.5, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
            Цвет и фон применяются к публичному квизу `/q/{slug || "…"}`. Не забудьте «Сохранить», а затем «Опубликовать».
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────── */

function CanvasInput({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: CSSProperties }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => (e.currentTarget.style.background = "rgba(40,85,156,0.06)")}
      onBlur={(e) => (e.currentTarget.style.background = "transparent")}
      style={{ width: "100%", boxSizing: "border-box", border: "none", borderRadius: 8, padding: "4px 8px", fontFamily: "inherit", background: "transparent", outline: "none", lineHeight: 1.35, ...style }}
    />
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <span onClick={onClick} title="Удалить" style={{ width: 22, height: 22, borderRadius: 999, background: "#F5F5F5", color: "#9ca3af", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>✕</span>;
}

function ProgressPreview({ accent, sel, total }: { accent: string; sel: Sel; total: number }) {
  const idx = sel === -1 ? 0 : (sel as number) + 1;
  const pct = Math.round((idx / total) * 100);
  return (
    <div style={{ height: 5, background: "#eceef2", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: accent, borderRadius: 999, transition: "width .2s" }} />
    </div>
  );
}

function darkOn(bg: string): string {
  return isDark(bg) ? "#ffffff" : "#111827";
}
function mutedOn(bg: string): string {
  return isDark(bg) ? "rgba(255,255,255,0.7)" : "#6b7280";
}
function isDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

const btnGhost: CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" };
const panelLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };
const addRow: CSSProperties = { border: "1px dashed #d1d5db", borderRadius: 12, padding: "9px 12px", fontSize: 12.5, fontWeight: 500, textAlign: "center", color: "#6b7280", cursor: "pointer" };
const miniBtn: CSSProperties = { flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "8px 0", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 };
