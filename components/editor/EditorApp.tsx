"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { routes } from "@/lib/nav";
import { api } from "@/lib/client/api";
import {
  blockCss, deriveSteps, docToDesign, FONT_LABELS, FONTS, migrateToDoc, newBlock, withCard, withSettings,
  type Block, type BlockPos, type BlockStyle, type BlockType, type CardCfg, type QuizDoc, type QuizSettings, type Step,
} from "@/lib/quiz/doc";
import { ButtonShowEditor } from "./ButtonShowEditor";
import { addRow, btnGhost, ColorRow, Field, IconBtn, inp, MultiUpload, panelLabel, Section, Segmented, Select, Slider, ta, Toggle, UploadField } from "./controls";

const PALETTE: [BlockType, string, string][] = [
  ["heading", "T", "Заголовок"],
  ["text", "¶", "Текст"],
  ["options", "☰", "Варианты"],
  ["input", "▭", "Поле"],
  ["button", "◉", "Кнопка"],
  ["image", "▣", "Картинка"],
  ["slider", "▦", "Слайдер"],
  ["html", "</>", "HTML/JS"],
];

function starterDoc(): QuizDoc {
  return migrateToDoc(
    [{ question: "Что вас интересует?", options: ["Вариант 1", "Вариант 2"] }],
    { accent: "#28559c", bg: "#ffffff", cover: { title: "Рассчитайте за 1 минуту", subtitle: "Ответьте на пару вопросов", benefits: ["Быстро", "Бесплатно"] }, contactForm: { title: "Оставьте контакты", bonus: "Скидка 10%" } }
  );
}

export function EditorApp() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Новый квиз");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [doc, setDoc] = useState<QuizDoc>(starterDoc);
  const [selStep, setSelStep] = useState(0);
  const [selBlock, setSelBlock] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"content" | "button">("content");
  const [gridSize, setGridSize] = useState(10);
  const [snap, setSnap] = useState(true);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [hoverStep, setHoverStep] = useState<string | null>(null);
  const [armedDel, setArmedDel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [dirty, setDirty] = useState(false);

  const idRef = useRef<string | null>(null);
  const selStepRef = useRef(selStep);
  selStepRef.current = selStep;
  const dragRef = useRef<{ kind: "block" | "step"; id: string; container: HTMLElement } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // ── перетаскивание мышью с зажатием (pointer drag) ──────
  const reorder = <T,>(arr: T[], from: number, to: number): T[] => {
    const n = [...arr]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n;
  };
  const onDragMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const items = Array.from(d.container.querySelectorAll("[data-id]")) as HTMLElement[];
    const ids = items.map((el) => el.getAttribute("data-id") || "");
    const from = ids.indexOf(d.id);
    if (from < 0) return;
    let to = from;
    items.forEach((el, i) => {
      if (ids[i] === d.id) return;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (i < from && e.clientY < mid) to = Math.min(to, i);
      if (i > from && e.clientY > mid) to = Math.max(to, i);
    });
    if (to === from) return;
    if (d.kind === "block") {
      setDoc((doc0) => ({ ...doc0, steps: doc0.steps.map((s, i) => (i === selStepRef.current ? { ...s, blocks: reorder(s.blocks, from, to) } : s)) }));
    } else {
      setDoc((doc0) => ({ ...doc0, steps: reorder(doc0.steps, from, to) }));
      setSelStep(to);
    }
    setDirty(true);
  }, []);
  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    setDragId(null);
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
    document.body.style.userSelect = "";
  }, [onDragMove]);
  const beginDrag = useCallback((kind: "block" | "step", id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = (e.currentTarget as HTMLElement).closest("[data-dnd]") as HTMLElement | null;
    if (!container) return;
    dragRef.current = { kind, id, container };
    setDragId(id);
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  }, [onDragMove, onDragEnd]);
  useEffect(() => () => { window.removeEventListener("pointermove", onDragMove); window.removeEventListener("pointerup", onDragEnd); }, [onDragMove, onDragEnd]);

  // Горячие клавиши: стрелки — сдвиг, Delete — удалить блок, Esc — снять выделение, Ctrl/Cmd+D — дублировать
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editMode !== "content" || !selBlock) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const st = doc.steps[selStep];
      if (e.key === "Escape") { setSelBlock(null); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteBlock(selBlock); return; }
      if ((e.key === "d" || e.key === "D" || e.key === "в" || e.key === "В") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); duplicateBlock(selBlock); return; }
      if (st?.layout === "free" && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const b = st.blocks.find((x) => x.id === selBlock); const p = b?.pos || { x: 0, y: 0, w: 220 };
        const d = e.shiftKey ? 10 : (snap && gridSize > 0 ? gridSize : 1);
        let x = p.x, y = p.y;
        if (e.key === "ArrowLeft") x = Math.max(0, x - d);
        else if (e.key === "ArrowRight") x = x + d;
        else if (e.key === "ArrowUp") y = Math.max(0, y - d);
        else if (e.key === "ArrowDown") y = y + d;
        patchBlockPos(selBlock, { x, y }); touch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selBlock, selStep, editMode, gridSize, snap, doc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setLoading(false); return; }
    idRef.current = id;
    api.quiz(id)
      .then(({ quiz }) => {
        setName(quiz.name); setSlug(quiz.slug); setStatus(quiz.status);
        const d = quiz.design as { doc?: QuizDoc };
        const built = d?.doc && Array.isArray(d.doc.steps) && d.doc.steps.length ? d.doc : migrateToDoc(quiz.steps, quiz.design);
        setDoc(built);
      })
      .catch(() => { /* демо-режим */ })
      .finally(() => setLoading(false));
  }, []);

  const touch = () => setDirty(true);
  const step = doc.steps[selStep];
  const block = step?.blocks.find((b) => b.id === selBlock) || null;

  // ── мутации doc ─────────────────────────────────────────
  const patchStep = (si: number, fn: (s: Step) => Step) => { setDoc((d) => ({ ...d, steps: d.steps.map((s, i) => (i === si ? fn(s) : s)) })); touch(); };
  const patchBlock = (bid: string, fn: (b: Block) => Block) => patchStep(selStep, (s) => ({ ...s, blocks: s.blocks.map((b) => (b.id === bid ? fn(b) : b)) }));
  const setStyle = <K extends keyof BlockStyle>(k: K, v: BlockStyle[K]) => { if (block) patchBlock(block.id, (b) => ({ ...b, style: { ...b.style, [k]: v } })); };
  const setBlockField = <K extends keyof Block>(k: K, v: Block[K]) => { if (block) patchBlock(block.id, (b) => ({ ...b, [k]: v })); };

  const addBlock = (type: BlockType) => {
    const nb = newBlock(type, doc.theme.accent);
    if (step?.layout === "free") {
      const n = step.blocks.length;
      nb.pos = { x: 20, y: 20 + n * 24, w: Math.max(120, withCard(doc).width - withCard(doc).padX * 2 - 40) };
    }
    setDoc((d) => ({ ...d, steps: d.steps.map((s, i) => (i === selStep ? { ...s, blocks: [...s.blocks, nb] } : s)) }));
    setSelBlock(nb.id); touch();
  };
  const deleteBlock = (bid: string) => { patchStep(selStep, (s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== bid) })); setSelBlock(null); };
  const duplicateBlock = (bid: string) => {
    const src = step.blocks.find((b) => b.id === bid); if (!src) return;
    const copy = { ...src, id: Math.random().toString(36).slice(2, 9), style: { ...src.style } };
    patchStep(selStep, (s) => { const idx = s.blocks.findIndex((b) => b.id === bid); const n = [...s.blocks]; n.splice(idx + 1, 0, copy); return { ...s, blocks: n }; });
    setSelBlock(copy.id);
  };
  const moveBlock = (bid: string, dir: -1 | 1) => patchStep(selStep, (s) => {
    const i = s.blocks.findIndex((b) => b.id === bid); const to = i + dir;
    if (to < 0 || to >= s.blocks.length) return s;
    const n = [...s.blocks]; [n[i], n[to]] = [n[to], n[i]]; return { ...s, blocks: n };
  });
  const setStepField = <K extends keyof Step>(k: K, v: Step[K]) => patchStep(selStep, (s) => ({ ...s, [k]: v }));
  const setStepBg = (patch: Partial<Step["bg"]>) => patchStep(selStep, (s) => ({ ...s, bg: { ...s.bg, ...patch } }));
  const setTheme = (patch: Partial<QuizDoc["theme"]>) => { setDoc((d) => ({ ...d, theme: { ...d.theme, ...patch } })); touch(); };
  const setCard = (patch: Partial<CardCfg>) => { setDoc((d) => ({ ...d, card: { ...withCard(d), ...patch } })); touch(); };

  // Привязка к сетке
  const snapVal = (v: number) => (snap && gridSize > 0 ? Math.round(v / gridSize) * gridSize : Math.round(v));

  // Свободное размещение: перемещение и ресайз блока мышью
  const patchBlockPos = (id: string, patch: Partial<BlockPos>) =>
    setDoc((d) => ({ ...d, steps: d.steps.map((s, i) => (i === selStepRef.current ? { ...s, blocks: s.blocks.map((b) => (b.id === id ? { ...b, pos: { x: 0, y: 0, w: 220, ...(b.pos || {}), ...patch } } : b)) } : s)) }));
  const beginMove = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const st = doc.steps[selStepRef.current];
    const b = st?.blocks.find((x) => x.id === id);
    const p0 = b?.pos || { x: 0, y: 0, w: 220 };
    const sx = e.clientX, sy = e.clientY;
    const card = withCard(doc);
    const contentW = card.width - card.padX * 2;
    const contentH = Math.max(240, card.minHeight || 480) - card.padY * 2;
    // измеряем высоту блока для выравнивания по вертикали
    const stage = (e.currentTarget as HTMLElement).closest("[data-free-stage]") as HTMLElement | null;
    const el = stage?.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
    const bh = p0.h || el?.offsetHeight || 40;
    const others = (st?.blocks || []).filter((x) => x.id !== id && x.pos).map((x) => x.pos as BlockPos);
    const T = 6;

    const move = (ev: PointerEvent) => {
      let nx = Math.max(0, snapVal(p0.x + ev.clientX - sx));
      let ny = Math.max(0, snapVal(p0.y + ev.clientY - sy));
      const vLines: number[] = [], hLines: number[] = [];
      // Кандидаты для выравнивания по X: центр окна + левые/центр/правые края других блоков
      const xCands = [contentW / 2, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
      for (const c of xCands) {
        if (Math.abs(nx - c) <= T) { nx = c; vLines.push(c); }
        else if (Math.abs(nx + p0.w / 2 - c) <= T) { nx = c - p0.w / 2; vLines.push(c); }
        else if (Math.abs(nx + p0.w - c) <= T) { nx = c - p0.w; vLines.push(c); }
      }
      // Кандидаты для выравнивания по Y: центр окна + верх/центр/низ других блоков
      const yCands = [contentH / 2, ...others.flatMap((o) => [o.y, o.y + (o.h || bh) / 2, o.y + (o.h || bh)])];
      for (const c of yCands) {
        if (Math.abs(ny - c) <= T) { ny = c; hLines.push(c); }
        else if (Math.abs(ny + bh / 2 - c) <= T) { ny = c - bh / 2; hLines.push(c); }
        else if (Math.abs(ny + bh - c) <= T) { ny = c - bh; hLines.push(c); }
      }
      setGuides({ v: Array.from(new Set(vLines)), h: Array.from(new Set(hLines)) });
      patchBlockPos(id, { x: Math.max(0, Math.round(nx)), y: Math.max(0, Math.round(ny)) });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); document.body.style.userSelect = ""; setGuides({ v: [], h: [] }); touch(); };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const beginResize = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const b = doc.steps[selStepRef.current]?.blocks.find((x) => x.id === id);
    const p0 = b?.pos || { x: 0, y: 0, w: 220 };
    const sx = e.clientX, sy = e.clientY, h0 = p0.h || 120;
    const move = (ev: PointerEvent) => patchBlockPos(id, { w: Math.max(40, snapVal(p0.w + ev.clientX - sx)), h: Math.max(24, snapVal(h0 + ev.clientY - sy)) });
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); document.body.style.userSelect = ""; touch(); };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  // Настройки кнопки/показа/анимаций
  const onButton = (p: Partial<QuizSettings["button"]>) => { setDoc((d) => { const s = withSettings(d); return { ...d, settings: { ...s, button: { ...s.button, ...p } } }; }); touch(); };
  const onDisplay = (p: Partial<QuizSettings["display"]>) => { setDoc((d) => { const s = withSettings(d); return { ...d, settings: { ...s, display: { ...s.display, ...p } } }; }); touch(); };
  const onAnim = (p: Partial<Pick<QuizSettings, "slideAnim" | "openAnim">>) => { setDoc((d) => { const s = withSettings(d); return { ...d, settings: { ...s, ...p } } as QuizDoc; }); touch(); };

  const addStep = () => {
    const ns: Step = { id: Math.random().toString(36).slice(2, 9), kind: "question", title: "Новый вопрос", bg: { type: "color", value: doc.theme.bg }, blocks: [newBlock("heading", doc.theme.accent), newBlock("options", doc.theme.accent)] };
    ns.blocks[0].text = "Новый вопрос";
    setDoc((d) => { const contactIdx = d.steps.findIndex((s) => s.kind === "contact"); const insertAt = contactIdx >= 0 ? contactIdx : d.steps.length; const n = [...d.steps]; n.splice(insertAt, 0, ns); return { ...d, steps: n }; });
    touch();
  };
  const deleteStep = (si: number) => {
    if (doc.steps.length <= 1) return;
    setDoc((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== si) }));
    setSelStep((cur) => Math.max(0, cur >= si ? cur - 1 : cur)); setSelBlock(null); touch();
  };
  // ── сохранение ──────────────────────────────────────────
  const persist = async (): Promise<string | null> => {
    setSaving(true);
    const design = docToDesign(doc);
    const steps = deriveSteps(doc);
    try {
      if (idRef.current) {
        const { quiz } = await api.updateQuiz(idRef.current, { name, steps, design });
        setSlug(quiz.slug); setStatus(quiz.status);
      } else {
        const { quiz } = await api.createQuiz({ name, steps, design });
        idRef.current = quiz.id; setSlug(quiz.slug); setStatus(quiz.status);
        if (typeof window !== "undefined") window.history.replaceState(null, "", `${routes.editor}?id=${quiz.id}`);
      }
      setSavedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      setDirty(false);
      return idRef.current;
    } catch (e) { alert(e instanceof Error ? e.message : "Не удалось сохранить"); return null; }
    finally { setSaving(false); }
  };
  const publish = async () => {
    const id = await persist(); if (!id) return;
    const next = status === "active" ? "draft" : "active";
    try { const { quiz } = await api.updateQuiz(id, { status: next }); setStatus(quiz.status); setSlug(quiz.slug); }
    catch (e) { alert(e instanceof Error ? e.message : "Ошибка"); }
  };
  const preview = () => { if (status === "active" && slug) window.open(`/q/${slug}`, "_blank"); else alert("Опубликуйте квиз, чтобы открыть публичную ссылку."); };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFEFEF", color: "#6b7280", fontSize: 14, fontFamily: FONTS.system }}>Загружаем редактор…</div>;

  const cardBg = step.bg.type === "image" && step.bg.value ? { backgroundImage: `url(${step.bg.value})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: step.bg.value };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#EFEFEF", color: "#111827", overflow: "hidden", fontFamily: FONTS.system }}>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e9e9e9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
          <Link href={routes.cabinet} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 14px", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>Кабинет
          </Link>
          <input value={name} onChange={(e) => { setName(e.target.value); touch(); }} style={{ fontSize: 14, fontWeight: 600, border: "1px solid transparent", borderRadius: 8, padding: "6px 8px", minWidth: 0, maxWidth: 320, fontFamily: "inherit", background: "transparent" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")} />
          <div style={{ fontSize: 11.5, color: dirty ? "#c2410c" : "#9ca3af", whiteSpace: "nowrap" }}>{dirty ? "Не сохранено" : savedAt ? `Сохранено в ${savedAt}` : status === "active" ? "Опубликован" : "Черновик"}</div>
        </div>
        <div style={{ display: "flex", background: "#F5F5F5", borderRadius: 9999, padding: 3, flexShrink: 0 }}>
          {([["content", "Контент"], ["button", "Кнопка и показ"]] as const).map(([m, label]) => (
            <div key={m} onClick={() => setEditMode(m)} style={{ borderRadius: 9999, padding: "6px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", background: editMode === m ? "#fff" : "transparent", color: editMode === m ? "#111827" : "#6b7280", boxShadow: editMode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{label}</div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div onClick={preview} style={btnGhost}>Предпросмотр</div>
          <div onClick={() => persist()} style={{ ...btnGhost, opacity: saving ? 0.6 : 1 }}>{saving ? "Сохраняем…" : "Сохранить"}</div>
          <div onClick={publish} style={{ background: status === "active" ? "#111827" : "#28559c", color: "#fff", borderRadius: 9999, padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>{status === "active" ? "Снять" : "Опубликовать"}</div>
        </div>
      </div>

      {editMode === "button" ? (
        <ButtonShowEditor settings={withSettings(doc)} onButton={onButton} onDisplay={onDisplay} onAnim={onAnim} />
      ) : (
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left: steps + palette */}
        <div style={{ width: 236, flexShrink: 0, background: "#fff", borderRight: "1px solid #e9e9e9", overflowY: "auto", padding: "16px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={panelLabel}>Шаги</div>
            <div data-dnd="steps" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {doc.steps.map((s, i) => {
                const active = selStep === i;
                const dragging = dragId === s.id;
                const canDel = s.kind === "question" && doc.steps.length > 1;
                const showDel = canDel && (hoverStep === s.id || armedDel === s.id);
                const armed = armedDel === s.id;
                return (
                  <div key={s.id} data-id={s.id} onClick={() => { setSelStep(i); setSelBlock(null); }}
                    onMouseEnter={() => { setHoverStep(s.id); if (armedDel && armedDel !== s.id) setArmedDel(null); }}
                    onMouseLeave={() => setHoverStep((h) => (h === s.id ? null : h))}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 12, cursor: "pointer", background: active ? "rgba(40,85,156,0.09)" : "#fff", border: "1px solid " + (active ? "rgba(40,85,156,0.25)" : "transparent"), opacity: dragging ? 0.5 : 1, boxShadow: dragging ? "0 8px 24px rgba(17,24,39,0.18)" : "none", transition: "box-shadow .15s ease" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: active ? "#28559c" : "#f3f4f6", color: active ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.kind === "cover" ? "◎" : s.kind === "contact" ? "✎" : i}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: active ? "#28559c" : "#374151" }}>{s.kind === "cover" ? "Обложка" : s.kind === "contact" ? "Контакты" : `Шаг ${i}`}</span>
                      <span style={{ display: "block", fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.blocks.find((b) => b.type === "heading")?.text || s.title}</span>
                    </span>
                    {showDel && (
                      <span title={armed ? "Нажмите ещё раз, чтобы удалить" : "Удалить шаг"}
                        onClick={(e) => { e.stopPropagation(); if (armed) { deleteStep(i); setArmedDel(null); } else { setArmedDel(s.id); } }}
                        style={{ width: 20, height: 20, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", fontSize: 11, fontWeight: 700, background: armed ? "#dc2626" : "#F5F5F5", color: armed ? "#fff" : "#9ca3af", transition: "background .15s" }}>{armed ? "✓" : "✕"}</span>
                    )}
                    <span onPointerDown={beginDrag("step", s.id)} onClick={(e) => e.stopPropagation()} title="Тянуть" style={{ color: "#c4c8cf", fontSize: 13, cursor: "grab", padding: "2px 4px", touchAction: "none" }}>⠿</span>
                  </div>
                );
              })}
              <div onClick={addStep} style={{ ...addRow, marginTop: 4, color: "#28559c", borderColor: "rgba(40,85,156,0.4)" }}>+ Добавить шаг</div>
            </div>
          </div>
          <div>
            <div style={panelLabel}>Добавить блок</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {PALETTE.map(([type, icon, label]) => (
                <div key={type} onClick={() => addBlock(type)} style={{ border: "1px solid #ececec", borderRadius: 12, padding: "10px 6px", fontSize: 11.5, fontWeight: 500, textAlign: "center", cursor: "pointer", color: "#374151", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#28559c", fontFamily: "monospace" }}>{icon}</span>{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: canvas */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "36px 24px" }}>
          {(() => {
            const card = withCard(doc);
            const free = step.layout === "free";
            const stageH = free ? Math.max(240, card.minHeight || 480) : undefined;
            const contentW = card.width - card.padX * 2;
            const contentH = stageH ? stageH - card.padY * 2 : undefined;
            const gridBg = free && gridSize > 0
              ? { backgroundImage: "linear-gradient(rgba(40,85,156,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(40,85,156,.10) 1px, transparent 1px)", backgroundSize: `${gridSize}px ${gridSize}px` }
              : {};
            const renderBlock = (b: Block, idx: number) => (
              <CanvasBlock key={b.id} block={b} accent={doc.theme.accent} selected={selBlock === b.id} dragging={dragId === b.id}
                free={free} freeIndex={idx} contentW={contentW}
                onSelect={(e) => { e.stopPropagation(); setSelBlock(b.id); }}
                onText={(v) => patchBlock(b.id, (bl) => ({ ...bl, text: v }))}
                onOption={(oi, v) => patchBlock(b.id, (bl) => ({ ...bl, options: (bl.options || []).map((o, j) => (j === oi ? v : o)) }))}
                onGrip={free ? beginMove(b.id) : beginDrag("block", b.id)} onResize={beginResize(b.id)} />
            );
            return (
              <div data-dnd="blocks" onClick={() => setSelBlock(null)}
                style={{ ...cardBg, borderRadius: card.radius, boxShadow: "0 12px 40px rgba(17,24,39,0.10)", width: card.width, maxWidth: "100%", padding: `${card.padY}px ${card.padX}px`, boxSizing: "border-box", minHeight: free ? stageH : Math.max(240, card.minHeight || 0) || 300, position: "relative", fontFamily: FONTS[doc.theme.font] || FONTS.system }}>
                {step.blocks.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "40px 0" }}>Пусто — добавьте блок слева</div>}
                {free ? (
                  <div data-free-stage style={{ position: "relative", height: contentH, ...gridBg }}>
                    <div style={{ position: "absolute", top: -18, left: 0, fontSize: 10, color: "#9ca3af", pointerEvents: "none" }}>Свободное размещение{snap && gridSize > 0 ? ` · сетка ${gridSize}px` : ""} · стрелки двигают, Del удаляет</div>
                    {guides.v.map((x, k) => <div key={`v${k}`} style={{ position: "absolute", left: x, top: -card.padY, bottom: -card.padY, width: 1, background: "#e0342f", zIndex: 5, pointerEvents: "none" }} />)}
                    {guides.h.map((y, k) => <div key={`h${k}`} style={{ position: "absolute", top: y, left: -card.padX, right: -card.padX, height: 1, background: "#e0342f", zIndex: 5, pointerEvents: "none" }} />)}
                    {step.blocks.map(renderBlock)}
                  </div>
                ) : (
                  step.blocks.map(renderBlock)
                )}
              </div>
            );
          })()}
        </div>

        {/* Right: inspector */}
        <div style={{ width: 288, flexShrink: 0, background: "#fff", borderLeft: "1px solid #e9e9e9", overflowY: "auto", padding: "18px 16px", boxSizing: "border-box" }}>
          {block ? (
            <BlockInspector block={block} setStyle={setStyle} setField={setBlockField}
              branchSteps={doc.steps.map((s, i) => ({ id: s.id, label: s.kind === "cover" ? "Обложка" : s.kind === "contact" ? "Контакты" : `Шаг ${i}` })).filter((x) => x.id !== step.id)}
              onDelete={() => deleteBlock(block.id)} onDup={() => duplicateBlock(block.id)}
              onUp={() => moveBlock(block.id, -1)} onDown={() => moveBlock(block.id, 1)} />
          ) : (
            <StepInspector step={step} theme={doc.theme} card={withCard(doc)} setStepField={setStepField} setStepBg={setStepBg} setTheme={setTheme} setCard={setCard}
              gridSize={gridSize} setGridSize={setGridSize} snap={snap} setSnap={setSnap}
              onDeleteStep={() => deleteStep(selStep)} canDelete={doc.steps.length > 1 && step.kind === "question"} />
          )}
        </div>
      </div>
      )}
    </div>
  );
}

/* ── canvas block ───────────────────────────────────────── */
function CanvasBlock({ block, accent, selected, dragging, free, freeIndex, contentW, onSelect, onText, onOption, onGrip, onResize }: {
  block: Block; accent: string; selected: boolean; dragging: boolean;
  free: boolean; freeIndex: number; contentW: number;
  onSelect: (e: React.MouseEvent) => void; onText: (v: string) => void; onOption: (i: number, v: string) => void;
  onGrip: (e: React.PointerEvent) => void; onResize: (e: React.PointerEvent) => void;
}) {
  const s = block.style;
  const w = free ? "100%" : `${s.width}%`;
  const css = blockCss(s) as CSSProperties;
  const pos = block.pos || { x: 0, y: freeIndex * 70, w: contentW };
  const outer: CSSProperties = free
    ? { position: "absolute", left: pos.x, top: pos.y, width: pos.w, height: pos.h, outline: selected ? "2px solid #28559c" : "2px dashed rgba(40,85,156,0.25)", outlineOffset: 2, borderRadius: 6, cursor: "move", opacity: dragging ? 0.5 : 1 }
    : { position: "relative", marginTop: s.marginTop, outline: selected ? "2px solid #28559c" : "2px solid transparent", outlineOffset: 3, borderRadius: 6, cursor: "pointer", opacity: dragging ? 0.4 : 1, transition: "opacity .12s ease" };
  const alignWrap: CSSProperties = { display: "flex", justifyContent: s.align === "left" ? "flex-start" : s.align === "right" ? "flex-end" : "center" };

  let inner: React.ReactNode;
  if (block.type === "heading" || block.type === "text") {
    inner = selected
      ? <input value={block.text || ""} onChange={(e) => onText(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ ...css, width: w, textAlign: s.align, border: "1px dashed #28559c", background: "rgba(40,85,156,0.05)", outline: "none" }} />
      : <div style={{ ...css, width: w, textAlign: s.align, whiteSpace: "pre-wrap" }}>{block.text || "Пустой текст"}</div>;
  } else if (block.type === "image") {
    inner = block.src
      ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={block.src} alt="" style={{ width: w, height: s.height || (free ? "100%" : "auto"), objectFit: "cover", borderRadius: s.radius }} />
      : <div style={{ width: w, height: s.height || 160, borderRadius: s.radius, background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>Картинка · загрузите файл</div>;
  } else if (block.type === "slider") {
    const imgs = block.images || [];
    inner = imgs.length
      ? /* eslint-disable-next-line @next/next/no-img-element */ <div style={{ width: w, height: s.height || 200, borderRadius: s.radius, overflow: "hidden", position: "relative", background: "#eef1f6" }}><img src={imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><span style={{ position: "absolute", bottom: 6, right: 8, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, borderRadius: 999, padding: "2px 8px" }}>▦ {imgs.length}</span></div>
      : <div style={{ width: w, height: s.height || 180, borderRadius: s.radius, background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>Слайдер · добавьте картинки</div>;
  } else if (block.type === "html") {
    inner = <div style={{ width: w, border: "1px dashed #d1d5db", borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "monospace", color: "#6b7280", overflow: "hidden" }}>{"</>"} HTML/JS блок</div>;
  } else if (block.type === "button") {
    inner = selected
      ? <input value={block.text || ""} onChange={(e) => onText(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ ...css, width: w, textAlign: "center", border: "1px dashed #fff", outline: "none" }} />
      : <div style={{ ...css, width: w, textAlign: "center" }}>{block.text}</div>;
  } else if (block.type === "input") {
    inner = <div style={{ ...css, width: w, color: "#9ca3af" }}>{block.placeholder || "Поле ввода"}</div>;
  } else {
    inner = (
      <div style={{ width: w, display: "flex", flexDirection: "column", gap: 8 }}>
        {(block.options || []).map((o, i) => (
          selected
            ? <input key={i} value={o} onChange={(e) => onOption(i, e.target.value)} onClick={(e) => e.stopPropagation()} style={{ border: `1px solid ${s.borderColor}`, borderRadius: s.radius || 12, padding: "11px 14px", fontSize: s.fontSize, color: s.color, outline: "none" }} />
            : <div key={i} style={{ textAlign: "left", border: `1px solid ${s.borderColor || "#e5e7eb"}`, borderRadius: s.radius || 12, padding: "12px 15px", fontSize: s.fontSize, background: "#fff", color: s.color }}>{o}</div>
        ))}
      </div>
    );
  }

  return (
    <div data-id={block.id} onClick={onSelect} style={outer}>
      {selected && (
        <span onPointerDown={onGrip} onClick={(e) => e.stopPropagation()} title={free ? "Двигать блок" : "Тянуть блок"}
          style={{ position: "absolute", top: -12, left: -6, zIndex: 4, background: accent, color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, cursor: free ? "move" : "grab", userSelect: "none", touchAction: "none", boxShadow: "0 2px 8px rgba(17,24,39,0.2)" }}>{free ? "✥ двигать" : "⠿ тянуть"}</span>
      )}
      {free && selected && (
        <span onPointerDown={onResize} onClick={(e) => e.stopPropagation()} title="Размер"
          style={{ position: "absolute", right: -7, bottom: -7, zIndex: 4, width: 14, height: 14, borderRadius: 3, background: "#fff", border: `2px solid ${accent}`, cursor: "nwse-resize", touchAction: "none" }} />
      )}
      {free ? inner : <div style={alignWrap}>{inner}</div>}
    </div>
  );
}

/* ── block inspector ────────────────────────────────────── */
function BlockInspector({ block, setStyle, setField, branchSteps, onDelete, onDup, onUp, onDown }: {
  block: Block;
  setStyle: <K extends keyof BlockStyle>(k: K, v: BlockStyle[K]) => void;
  setField: <K extends keyof Block>(k: K, v: Block[K]) => void;
  branchSteps: { id: string; label: string }[];
  onDelete: () => void; onDup: () => void; onUp: () => void; onDown: () => void;
}) {
  const s = block.style;
  const typeName: Record<BlockType, string> = { heading: "Заголовок", text: "Текст", options: "Варианты", input: "Поле", button: "Кнопка", image: "Картинка", slider: "Слайдер", html: "HTML/JS" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{typeName[block.type]}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn title="Выше" onClick={onUp}>↑</IconBtn>
          <IconBtn title="Ниже" onClick={onDown}>↓</IconBtn>
          <IconBtn title="Дублировать" onClick={onDup}>⧉</IconBtn>
          <IconBtn title="Удалить" onClick={onDelete} danger>✕</IconBtn>
        </div>
      </div>

      {/* Контент */}
      <Section title="Контент">
        {(block.type === "heading" || block.type === "text" || block.type === "button") && (
          <Field label="Текст"><textarea value={block.text || ""} onChange={(e) => setField("text", e.target.value)} rows={2} style={ta} /></Field>
        )}
        {block.type === "options" && (
          <OptionsEditor options={block.options || []} targets={block.targets || []} steps={branchSteps}
            onChange={(o) => setField("options", o)} onTargets={(t) => setField("targets", t)} />
        )}
        {block.type === "input" && (
          <>
            <Field label="Тип поля"><Select value={block.field || "text"} onChange={(v) => setField("field", v as Block["field"])} options={[["name", "Имя"], ["phone", "Телефон"], ["email", "E-mail"], ["text", "Произвольное"]]} /></Field>
            <Field label="Подсказка"><input value={block.placeholder || ""} onChange={(e) => setField("placeholder", e.target.value)} style={inp} /></Field>
          </>
        )}
        {block.type === "image" && (
          <Field label="Картинка (файл)"><UploadField value={block.src} onChange={(v) => setField("src", v)} /></Field>
        )}
        {block.type === "slider" && (
          <Field label="Картинки слайдера (файлы)"><MultiUpload images={block.images || []} onChange={(imgs) => setField("images", imgs)} /></Field>
        )}
        {block.type === "html" && (
          <Field label="HTML / встраивание"><textarea value={block.html || ""} onChange={(e) => setField("html", e.target.value)} rows={5} style={{ ...ta, fontFamily: "monospace", fontSize: 12 }} /></Field>
        )}
        {(block.type === "button" || block.type === "options" || block.type === "image" || block.type === "html") && (
          <Field label="Цель Метрики/коллтрекинга при клике"><input value={block.goal || ""} onChange={(e) => setField("goal", e.target.value)} placeholder="например quiz_click" style={{ ...inp, fontFamily: "monospace" }} /></Field>
        )}
      </Section>

      {/* Размер и стиль */}
      <Section title="Размер и стиль">
        <Slider label="Ширина" v={s.width} min={10} max={100} unit="%" onChange={(v) => setStyle("width", v)} />
        <Field label="Выравнивание"><Segmented value={s.align} onChange={(v) => setStyle("align", v as BlockStyle["align"])} options={[["left", "◧"], ["center", "▣"], ["right", "◨"]]} /></Field>
        {block.type !== "image" && block.type !== "html" && <Slider label="Шрифт" v={s.fontSize} min={10} max={48} unit="px" onChange={(v) => setStyle("fontSize", v)} />}
        {(block.type === "heading" || block.type === "text" || block.type === "button" || block.type === "options" || block.type === "input") && (
          <Field label="Насыщенность"><Select value={String(s.fontWeight)} onChange={(v) => setStyle("fontWeight", Number(v))} options={[["400", "Обычный"], ["500", "Средний"], ["600", "Полужирный"], ["700", "Жирный"]]} /></Field>
        )}
        {(block.type === "image" || block.type === "button") && <Slider label="Высота" v={s.height} min={0} max={400} unit="px" onChange={(v) => setStyle("height", v)} />}
        {block.type !== "image" && block.type !== "html" && <ColorRow label="Цвет текста" value={s.color} onChange={(v) => setStyle("color", v)} />}
        <ColorRow label="Фон блока" value={s.bg === "transparent" ? "#ffffff" : s.bg} onChange={(v) => setStyle("bg", v)} extra={<span onClick={() => setStyle("bg", "transparent")} style={{ fontSize: 11, color: s.bg === "transparent" ? "#28559c" : "#9ca3af", cursor: "pointer" }}>прозрачный</span>} />
        <Slider label="Толщина рамки" v={s.borderWidth} min={0} max={8} unit="px" onChange={(v) => setStyle("borderWidth", v)} />
        <ColorRow label="Цвет рамки" value={s.borderColor} onChange={(v) => setStyle("borderColor", v)} />
        <Slider label="Скругление" v={s.radius} min={0} max={40} unit="px" onChange={(v) => setStyle("radius", v)} />
        <Slider label="Отступ ↕" v={s.padY} min={0} max={48} unit="px" onChange={(v) => setStyle("padY", v)} />
        <Slider label="Отступ ↔" v={s.padX} min={0} max={48} unit="px" onChange={(v) => setStyle("padX", v)} />
        <Slider label="Сверху" v={s.marginTop} min={0} max={60} unit="px" onChange={(v) => setStyle("marginTop", v)} />
        <Field label="Шрифт"><Select value={s.font} onChange={(v) => setStyle("font", v)} options={FONT_LABELS} /></Field>
      </Section>
    </div>
  );
}

function OptionsEditor({ options, targets, steps, onChange, onTargets }: {
  options: string[]; targets: string[]; steps: { id: string; label: string }[];
  onChange: (o: string[]) => void; onTargets: (t: string[]) => void;
}) {
  const norm = (t: string[]) => { const n = [...t]; while (n.length < options.length) n.push(""); return n.slice(0, options.length); };
  const setTarget = (i: number, v: string) => { const n = norm(targets); n[i] = v; onTargets(n); };
  const removeAt = (i: number) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, j) => j !== i));
    onTargets(norm(targets).filter((_, j) => j !== i));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((o, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, border: "1px solid #f0f0f0", borderRadius: 10, padding: "8px 9px" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={o} onChange={(e) => onChange(options.map((x, j) => (j === i ? e.target.value : x)))} style={{ ...inp, flex: 1 }} />
            <IconBtn title="Удалить" danger onClick={() => removeAt(i)}>✕</IconBtn>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>→ ведёт на</span>
            <Select value={(targets[i] || "")} onChange={(v) => setTarget(i, v)} options={[["", "Следующий шаг"], ...steps.map((s) => [s.id, s.label] as [string, string])]} />
          </div>
        </div>
      ))}
      <div onClick={() => onChange([...options, `Вариант ${options.length + 1}`])} style={addRow}>+ Вариант</div>
    </div>
  );
}

/* ── step inspector ─────────────────────────────────────── */
function StepInspector({ step, theme, card, setStepField, setStepBg, setTheme, setCard, gridSize, setGridSize, snap, setSnap, onDeleteStep, canDelete }: {
  step: Step; theme: QuizDoc["theme"]; card: CardCfg;
  setStepField: <K extends keyof Step>(k: K, v: Step[K]) => void;
  setStepBg: (p: Partial<Step["bg"]>) => void;
  setTheme: (p: Partial<QuizDoc["theme"]>) => void;
  setCard: (p: Partial<CardCfg>) => void;
  gridSize: number; setGridSize: (v: number) => void; snap: boolean; setSnap: (v: boolean) => void;
  onDeleteStep: () => void; canDelete: boolean;
}) {
  const free = step.layout === "free";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{step.kind === "cover" ? "Обложка" : step.kind === "contact" ? "Форма контактов" : "Шаг-вопрос"}</div>
        <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>Кликните блок на холсте, чтобы настроить его</div>
      </div>

      <Section title="Окно квиза (размер)">
        <Slider label="Ширина окна" v={card.width} min={300} max={760} unit="px" onChange={(v) => setCard({ width: v })} />
        <Slider label="Мин. высота" v={card.minHeight} min={0} max={720} unit="px" onChange={(v) => setCard({ minHeight: v })} />
        <Slider label="Отступ ↔" v={card.padX} min={0} max={64} unit="px" onChange={(v) => setCard({ padX: v })} />
        <Slider label="Отступ ↕" v={card.padY} min={0} max={64} unit="px" onChange={(v) => setCard({ padY: v })} />
        <Slider label="Скругление окна" v={card.radius} min={0} max={40} unit="px" onChange={(v) => setCard({ radius: v })} />
      </Section>

      <Section title="Размещение блоков на шаге">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#374151" }}>Свободное (тянуть блоки мышью)</span>
          <Toggle on={free} onClick={() => setStepField("layout", free ? "flow" : "free")} />
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>{free ? "Блоки двигаются и меняют размер мышью. Задайте мин. высоту окна выше." : "Блоки идут в столбик сверху вниз."}</div>
        {free && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#374151" }}>Привязка к сетке</span>
              <Toggle on={snap} onClick={() => setSnap(!snap)} />
            </div>
            <Slider label="Шаг сетки" v={gridSize} min={2} max={40} unit="px" onChange={setGridSize} />
          </>
        )}
      </Section>

      <Section title="Фон шага">
        <Field label="Тип"><Segmented value={step.bg.type} onChange={(v) => setStepBg({ type: v as "color" | "image" })} options={[["color", "Цвет"], ["image", "Картинка"]]} /></Field>
        {step.bg.type === "color"
          ? <ColorRow label="Цвет фона" value={step.bg.value} onChange={(v) => setStepBg({ value: v })} />
          : <Field label="Фон-картинка (файл)"><UploadField value={step.bg.value} onChange={(v) => setStepBg({ value: v })} /></Field>}
      </Section>

      <Section title="Аналитика шага">
        <Field label="Цель при показе (Метрика/коллтрекинг)"><input value={step.goal || ""} onChange={(e) => setStepField("goal", e.target.value)} placeholder="например quiz_step_view" style={{ ...inp, fontFamily: "monospace" }} /></Field>
      </Section>

      <Section title="Свой JS-код на шаге">
        <textarea value={step.js || ""} onChange={(e) => setStepField("js", e.target.value)} rows={4} placeholder="// выполнится при показе шага" style={{ ...ta, fontFamily: "monospace", fontSize: 12 }} />
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Доступны переменные <code>step</code> (индекс) и <code>quiz</code>.</div>
      </Section>

      <Section title="Тема квиза">
        <ColorRow label="Акцентный цвет" value={theme.accent} onChange={(v) => setTheme({ accent: v })} />
        <Field label="Шрифт по умолчанию"><Select value={theme.font} onChange={(v) => setTheme({ font: v })} options={FONT_LABELS} /></Field>
      </Section>

      {canDelete && <div onClick={onDeleteStep} style={{ textAlign: "center", border: "1px solid rgba(153,27,27,0.3)", color: "#991b1b", borderRadius: 9999, padding: "9px 0", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>Удалить шаг</div>}
    </div>
  );
}

