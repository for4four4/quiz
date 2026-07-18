"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { routes } from "@/lib/nav";

type BlockId = "title" | "subtitle" | "benefits" | "button";
type Mode = "slides" | "button" | "display";

const names: Record<BlockId, string> = { title: "Заголовок", subtitle: "Текст", benefits: "Преимущества", button: "Кнопка" };
const content: Record<BlockId, string> = {
  title: "Рассчитайте стоимость кухни за 1 минуту",
  subtitle: "Ответьте на 5 вопросов — получите точную смету и скидку 10% на первый заказ",
  benefits: "✓ Бесплатный замер    ✓ Смета за 1 день    ✓ Рассрочка 0%",
  button: "Начать расчёт",
};
const extras: Record<BlockId, { weight: number; align: string; bg: string; padX: string }> = {
  title: { weight: 600, align: "center", bg: "transparent", padX: "8px" },
  subtitle: { weight: 400, align: "center", bg: "transparent", padX: "8px" },
  benefits: { weight: 500, align: "center", bg: "#fafafa", padX: "16px" },
  button: { weight: 600, align: "center", bg: "#28559c", padX: "16px" },
};
const goals: Record<BlockId, string> = { title: "quiz_title_click", subtitle: "quiz_text_click", benefits: "quiz_benefits_click", button: "quiz_start_click" };
const stepDefs = ["Обложка", "Тип кухни", "Размеры", "Бюджет", "Контакты", "Результат"];
const paletteDefs = [
  { label: "Заголовок", icon: "T" }, { label: "Текст", icon: "¶" }, { label: "Картинка", icon: "▣" }, { label: "Варианты", icon: "☰" },
  { label: "Телефон", icon: "☎" }, { label: "Почта", icon: "@" }, { label: "Дата", icon: "▦" }, { label: "Кнопка", icon: "▭" },
];
const bgImgs = [
  { label: "Кухня — светлая", v: "linear-gradient(135deg,#e8edf5,#c9d6ea)", labelColor: "#28559c" },
  { label: "Кухня — тёмная", v: "linear-gradient(135deg,#1c2c47,#28559c)", labelColor: "#ffffff" },
  { label: "Градиент бренда", v: "linear-gradient(120deg,#28559c,#5a8cd2)", labelColor: "#ffffff" },
];
const popupBgList = [
  { label: "Нет", labelColor: "#374151", css: "transparent" },
  { label: "Градиент", labelColor: "#ffffff", css: "linear-gradient(120deg,#28559c,#5a8cd2)" },
  { label: "Фото", labelColor: "#ffffff", css: "linear-gradient(135deg,#1c2c47,#3f5e8f)" },
];
const openAnimNames = ["qvAFade", "qvAZoom", "qvASlideUp", "qvAFlip"];
const slideAnimNames = ["qvAFade", "qvASlideL", "qvASlideUp", "qvAZoom", "qvAFlip"];

type Prop = { width: number; font: number; color: string; borderW: number; borderColor: string; radius: number; padY: number };
const initialProps: Record<BlockId, Prop> = {
  title: { width: 100, font: 26, color: "#111827", borderW: 0, borderColor: "#28559c", radius: 0, padY: 4 },
  subtitle: { width: 90, font: 15, color: "#4b5563", borderW: 0, borderColor: "#28559c", radius: 0, padY: 4 },
  benefits: { width: 100, font: 14, color: "#374151", borderW: 1, borderColor: "#e5e7eb", radius: 12, padY: 14 },
  button: { width: 60, font: 15, color: "#ffffff", borderW: 0, borderColor: "#28559c", radius: 12, padY: 13 },
};

export function EditorApp() {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<BlockId | null>("title");
  const [mobile, setMobile] = useState(false);
  const [mode, setMode] = useState<Mode>("slides");

  const [btnText, setBtnText] = useState("Пройти квиз");
  const [btnSub, setBtnSub] = useState("Займёт 1 минуту");
  const [showSub, setShowSub] = useState(true);
  const [btnBg, setBtnBg] = useState("#28559c");
  const [btnW, setBtnW] = useState(200);
  const [btnH, setBtnH] = useState(56);
  const [btnR, setBtnR] = useState(28);
  const [btnPos, setBtnPos] = useState(8);
  const [btnImg, setBtnImg] = useState(true);

  const [dispType, setDispType] = useState(0);
  const [trigger, setTrigger] = useState(0);
  const [delaySec, setDelaySec] = useState(15);
  const [pageUrl, setPageUrl] = useState("/ceny");
  const [openAnim, setOpenAnim] = useState(1);
  const [slideAnim, setSlideAnim] = useState(1);
  const [dim, setDim] = useState(45);
  const [popupBg, setPopupBg] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progressOn, setProgressOn] = useState(true);
  const [prStyle, setPrStyle] = useState(0);
  const [prColor, setPrColor] = useState("#28559c");

  const [bgMode, setBgMode] = useState<"color" | "image">("color");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImage, setBgImage] = useState(0);
  const [stepGoal, setStepGoal] = useState(true);

  const [order, setOrder] = useState<BlockId[]>(["title", "subtitle", "benefits", "button"]);
  const [dragging, setDragging] = useState<BlockId | null>(null);
  const [analytics, setAnalytics] = useState<Record<BlockId, { metrika: boolean; call: boolean }>>({
    title: { metrika: false, call: false },
    subtitle: { metrika: false, call: false },
    benefits: { metrika: false, call: false },
    button: { metrika: true, call: true },
  });
  const [props, setProps] = useState<Record<BlockId, Prop>>(initialProps);

  const canvasEl = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const orderRef = useRef(order);
  orderRef.current = order;
  const propsRef = useRef(props);
  propsRef.current = props;

  const updBlock = (id: BlockId, key: keyof Prop, val: number | string) =>
    setProps((p) => ({ ...p, [id]: { ...p[id], [key]: val } }));
  const upd = (key: keyof Prop, val: number | string) => { if (sel) updBlock(sel, key, val); };

  const startResize = (id: BlockId, side: "l" | "r" | "b", e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = propsRef.current[id].width, startPad = propsRef.current[id].padY;
    const canvasPx = canvasEl.current ? canvasEl.current.getBoundingClientRect().width - 72 : 700;
    const move = (ev: PointerEvent) => {
      if (side === "b") {
        updBlock(id, "padY", Math.max(2, Math.min(80, Math.round(startPad + (ev.clientY - startY)))));
      } else {
        const dx = (ev.clientX - startX) * (side === "l" ? -1 : 1);
        updBlock(id, "width", Math.max(30, Math.min(100, Math.round(startW + (dx * 2 / canvasPx) * 100))));
      }
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startDrag = (id: BlockId, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(id);
    const move = (ev: PointerEvent) => {
      const ord = [...orderRef.current];
      const from = ord.indexOf(id);
      let to = from;
      ord.forEach((bid, i) => {
        if (bid === id) return;
        const el = blockRefs.current[bid];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const midY = r.top + r.height / 2;
        if (i < from && ev.clientY < midY) to = Math.min(to, i);
        if (i > from && ev.clientY > midY) to = Math.max(to, i);
      });
      if (to !== from) {
        ord.splice(from, 1);
        ord.splice(to, 0, id);
        setOrder(ord);
      }
    };
    const up = () => { setDragging(null); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const toggleAn = (key: "metrika" | "call") => { if (sel) setAnalytics((a) => ({ ...a, [sel]: { ...a[sel], [key]: !a[sel][key] } })); };

  const p = sel ? props[sel] : null;
  const an = sel ? analytics[sel] : null;
  const cardBg = bgMode === "color" ? bgColor : bgImgs[bgImage].v;
  const canvasW = mobile ? "390px" : "760px";
  const btnJustify = ["flex-start", "center", "flex-end"][btnPos % 3];
  const btnAlign = ["flex-start", "center", "flex-end"][Math.floor(btnPos / 3)];
  const btnColor = btnBg === "#ffffff" ? "#28559c" : "#ffffff";

  const progress = <ProgressBar style={prStyle} color={prColor} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#EFEFEF", color: "#111827", overflow: "hidden" }}>
      {/* Topbar */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e9e9e9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Link href={routes.cabinet} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 14px", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>Кабинет
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Подбор кухни</div>
            <div style={{ fontSize: 11.5, color: "#9ca3af" }}>Сохранено только что</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", background: "#F5F5F5", borderRadius: 9999, padding: 3 }}>
            {([["slides", "Слайды"], ["button", "Кнопка"], ["display", "Показ"]] as const).map(([id, label]) => (
              <div key={id} onClick={() => setMode(id)} style={segStyle(mode === id)}>{label}</div>
            ))}
          </div>
          {mode === "slides" && (
            <div style={{ display: "flex", background: "#F5F5F5", borderRadius: 9999, padding: 3 }}>
              <div onClick={() => setMobile(false)} style={segStyle(!mobile)}>Десктоп</div>
              <div onClick={() => setMobile(true)} style={segStyle(mobile)}>Мобайл</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Предпросмотр</div>
          <div style={{ background: "#28559c", color: "#ffffff", borderRadius: 9999, padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Опубликовать</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left panel */}
        {mode === "slides" && (
          <div style={{ width: 232, flexShrink: 0, background: "#ffffff", borderRight: "1px solid #e9e9e9", overflowY: "auto", padding: "16px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={panelLabel}>Шаги квиза</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {stepDefs.map((label, i) => {
                  const active = step === i;
                  return (
                    <div key={label} onClick={() => setStep(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer", background: active ? "rgba(40,85,156,0.09)" : "transparent", color: active ? "#28559c" : "#374151", transition: "background .2s" }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: active ? "#28559c" : "#f3f4f6", color: active ? "#ffffff" : "#6b7280", fontSize: 10.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#28559c", border: "1px dashed rgba(40,85,156,0.4)", justifyContent: "center" }}>+ Добавить шаг</div>
              </div>
            </div>
            <div>
              <div style={panelLabel}>Добавить блок</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {paletteDefs.map((pl) => (
                  <div key={pl.label} style={{ border: "1px solid #ececec", borderRadius: 12, padding: "10px 6px", fontSize: 11.5, fontWeight: 500, textAlign: "center", cursor: "grab", color: "#374151", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#28559c" }}>{pl.icon}</span>{pl.label}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, border: "1px dashed #d1d5db", borderRadius: 12, padding: 9, fontSize: 11.5, fontWeight: 500, textAlign: "center", color: "#6b7280", cursor: "pointer" }}>+ Своё поле любого типа</div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 24px" }}>
          {mode === "button" && (
            <SiteMock>
              <div style={{ position: "absolute", inset: 0, display: "flex", padding: 20, boxSizing: "border-box", pointerEvents: "none", justifyContent: btnJustify, alignItems: btnAlign }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, boxSizing: "border-box", padding: "0 20px", boxShadow: "0 8px 28px rgba(40,85,156,0.35)", width: btnW, height: btnH, borderRadius: btnR, background: btnBg, color: btnColor, justifyContent: "center" }}>
                  {btnImg && <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}><rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="currentColor" opacity="0.5" /><rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="currentColor" opacity="0.75" /><rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="currentColor" /></svg>}
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{btnText}</span>
                    {showSub && <span style={{ display: "block", fontSize: 11, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{btnSub}</span>}
                  </span>
                </div>
              </div>
            </SiteMock>
          )}

          {mode === "display" && (
            <SiteMock trigPage={trigger === 2 ? pageUrl : ""}>
              <div style={{ position: "absolute", inset: 0, background: popupBgList[popupBg].css, backgroundSize: "cover", backgroundPosition: "center", transition: "background .3s" }} />
              <div style={{ position: "absolute", inset: 0, background: `rgba(15,23,42,${(dim / 100).toFixed(2)})`, transition: "background .3s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {playing && (
                  <div style={{ background: "#ffffff", borderRadius: 16, width: 340, padding: 24, boxSizing: "border-box", boxShadow: "0 24px 64px rgba(15,23,42,0.35)", animation: `${openAnimNames[openAnim]} .55s cubic-bezier(.2,.8,.3,1)` }}>
                    {progressOn && <div style={{ marginBottom: 16 }}>{progress}</div>}
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>Рассчитайте стоимость кухни за 1 минуту</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>Ответьте на 5 вопросов — получите смету и скидку 10%</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 10px", fontSize: 11.5 }}>Прямая</div>
                      <div style={{ border: "1px solid #28559c", background: "rgba(40,85,156,0.05)", borderRadius: 10, padding: "9px 10px", fontSize: 11.5 }}>Угловая</div>
                    </div>
                    <div style={{ background: "#28559c", color: "#ffffff", borderRadius: 10, padding: "10px 0", fontSize: 12.5, fontWeight: 500, textAlign: "center", marginTop: 12 }}>Далее →</div>
                  </div>
                )}
              </div>
              <div onClick={() => { setPlaying(false); setTimeout(() => setPlaying(true), 60); }} style={{ position: "absolute", bottom: 14, right: 14, background: "#111827", color: "#ffffff", borderRadius: 9999, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffffff"><polygon points="5 3 19 12 5 21 5 3" /></svg>Проиграть появление
              </div>
            </SiteMock>
          )}

          {mode === "slides" && (
            <div ref={canvasEl} onClick={() => setSel(null)} style={{ background: cardBg, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 20, boxShadow: "0 12px 40px rgba(17,24,39,0.08)", width: canvasW, maxWidth: "100%", transition: "width .3s", padding: 36, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
              {progressOn && <div style={{ marginBottom: 6 }}>{progress}</div>}
              {order.map((id) => {
                const bp = props[id];
                const ex = extras[id];
                const selected = sel === id;
                return (
                  <div key={id} ref={(el) => { blockRefs.current[id] = el; }} onClick={(e) => { e.stopPropagation(); setSel(id); }} style={{ position: "relative", cursor: "pointer", outline: selected ? "1.5px solid #28559c" : "1.5px solid transparent", outlineOffset: 4, borderRadius: 6, opacity: dragging === id ? 0.55 : 1 }}>
                    {selected && (
                      <>
                        <span onPointerDown={(e) => startDrag(id, e)} style={{ position: "absolute", top: -26, left: -4, background: "#28559c", color: "#ffffff", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 2, cursor: "grab", userSelect: "none", touchAction: "none" }}>⠿ {names[id]} · тяните</span>
                        <Corner style={{ left: -9, top: -9 }} /><Corner style={{ right: -9, top: -9 }} /><Corner style={{ left: -9, bottom: -9 }} /><Corner style={{ right: -9, bottom: -9 }} />
                        <span onPointerDown={(e) => startResize(id, "l", e)} style={{ position: "absolute", width: 8, height: 20, background: "#ffffff", border: "1.5px solid #28559c", borderRadius: 4, left: -9, top: "50%", marginTop: -10, zIndex: 3, cursor: "ew-resize", touchAction: "none" }} />
                        <span onPointerDown={(e) => startResize(id, "r", e)} style={{ position: "absolute", width: 8, height: 20, background: "#ffffff", border: "1.5px solid #28559c", borderRadius: 4, right: -9, top: "50%", marginTop: -10, zIndex: 3, cursor: "ew-resize", touchAction: "none" }} />
                        <span onPointerDown={(e) => startResize(id, "b", e)} style={{ position: "absolute", width: 20, height: 8, background: "#ffffff", border: "1.5px solid #28559c", borderRadius: 4, bottom: -9, left: "50%", marginLeft: -10, zIndex: 3, cursor: "ns-resize", touchAction: "none" }} />
                      </>
                    )}
                    <div style={{ width: `${bp.width}%`, margin: "0 auto", boxSizing: "border-box", fontSize: bp.font, color: bp.color, background: ex.bg, border: bp.borderW ? `${bp.borderW}px solid ${bp.borderColor}` : "none", borderRadius: bp.radius, padding: `${bp.padY}px ${ex.padX}`, fontWeight: ex.weight, textAlign: ex.align as CSSProperties["textAlign"], lineHeight: 1.35 }}>{content[id]}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 264, flexShrink: 0, background: "#ffffff", borderLeft: "1px solid #e9e9e9", overflowY: "auto", padding: "18px 16px", boxSizing: "border-box" }}>
          {mode === "slides" && sel && p && an && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{names[sel]}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>id: {sel}</div>
              </div>
              <Slider label="Ширина" value={p.width} min={30} max={100} valueLabel={`${p.width}%`} onChange={(v) => upd("width", v)} />
              <Slider label="Размер шрифта" value={p.font} min={12} max={40} valueLabel={`${p.font} px`} onChange={(v) => upd("font", v)} />
              <Swatches label="Цвет текста" colors={["#111827", "#4b5563", "#28559c", "#166534", "#ffffff"]} active={p.color} onPick={(v) => upd("color", v)} />
              <Slider label="Бордер" value={p.borderW} min={0} max={12} valueLabel={p.borderW ? `${p.borderW} px` : "Нет"} onChange={(v) => upd("borderW", v)} />
              <Swatches label="Цвет бордера" colors={["#e5e7eb", "#28559c", "#111827", "#991b1b"]} active={p.borderColor} onPick={(v) => upd("borderColor", v)} />
              <Slider label="Скругление" value={p.radius} min={0} max={24} valueLabel={`${p.radius} px`} onChange={(v) => upd("radius", v)} />
              <div>
                <div style={fieldLabel}>Шрифт</div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "9px 12px", fontSize: 12.5, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}><span>Системный</span><span style={{ color: "#9ca3af" }}>▾</span></div>
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><AnalyticsIcon /><div style={{ fontSize: 12.5, fontWeight: 600 }}>Аналитика на блоке</div></div>
                <div>
                  <div onClick={() => toggleAn("metrika")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                    <span style={{ fontSize: 12.5, color: "#374151" }}>Цель в Яндекс.Метрику</span>
                    <Toggle on={an.metrika} />
                  </div>
                  {an.metrika && (
                    <>
                      <div style={{ marginTop: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: "8px 12px", fontSize: 12, fontFamily: "ui-monospace,Menlo,monospace", color: "#28559c", background: "#fafafa" }}>{goals[sel]}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>Цель сработает при клике на блок</div>
                    </>
                  )}
                </div>
                <div onClick={() => toggleAn("call")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontSize: 12.5, color: "#374151" }}>Событие коллтрекинга</span>
                  <Toggle on={an.call} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontSize: 12.5, color: "#374151" }}>Свой JS-код на клик</span>
                  <span style={{ fontSize: 11.5, color: "#28559c", fontWeight: 600 }}>Добавить</span>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "flex", gap: 8 }}>
                <div style={{ flex: 1, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "8px 0", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Дублировать</div>
                <div style={{ flex: 1, textAlign: "center", border: "1px solid rgba(153,27,27,0.3)", color: "#991b1b", borderRadius: 9999, padding: "8px 0", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Удалить</div>
              </div>
            </div>
          )}

          {mode === "slides" && !sel && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Слайд · Обложка</div>
              <div>
                <div style={fieldLabel}>Фон карточки</div>
                <div style={{ display: "flex", background: "#F5F5F5", borderRadius: 9999, padding: 3, marginBottom: 12 }}>
                  <div onClick={() => setBgMode("color")} style={{ flex: 1, textAlign: "center", ...segStyle(bgMode === "color"), padding: "6px 0" }}>Цвет</div>
                  <div onClick={() => setBgMode("image")} style={{ flex: 1, textAlign: "center", ...segStyle(bgMode === "image"), padding: "6px 0" }}>Картинка</div>
                </div>
                {bgMode === "color" ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["#ffffff", "#fafafa", "#f0f4fa", "#e8edf5", "#28559c", "#111827"].map((v) => (
                      <span key={v} onClick={() => setBgColor(v)} style={{ width: 28, height: 28, borderRadius: 9999, cursor: "pointer", background: v, border: "1px solid #e5e7eb", boxSizing: "border-box", outline: bgColor === v ? "2px solid #28559c" : "none", outlineOffset: 2 }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bgImgs.map((im, i) => (
                      <div key={im.label} onClick={() => setBgImage(i)} style={{ height: 52, borderRadius: 12, cursor: "pointer", background: im.v, outline: bgImage === i ? "2px solid #28559c" : "none", outlineOffset: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: im.labelColor }}>{im.label}</div>
                    ))}
                    <div style={{ border: "1px dashed #d1d5db", borderRadius: 12, padding: 12, fontSize: 11.5, fontWeight: 500, textAlign: "center", color: "#6b7280", cursor: "pointer" }}>↑ Загрузить свою</div>
                  </div>
                )}
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><AnalyticsIcon /><div style={{ fontSize: 12.5, fontWeight: 600 }}>Аналитика шага</div></div>
                <div onClick={() => setStepGoal((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontSize: 12.5, color: "#374151" }}>Цель при показе шага</span>
                  <Toggle on={stepGoal} />
                </div>
                {stepGoal && <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "8px 12px", fontSize: 12, fontFamily: "ui-monospace,Menlo,monospace", color: "#28559c", background: "#fafafa" }}>quiz_step_cover</div>}
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>Цели и события можно повесить на каждый шаг, кнопку и поле — конверсия видна на всей воронке.</div>
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>Выберите блок на холсте, чтобы настроить его стиль и аналитику.</div>
            </div>
          )}

          {mode === "button" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Кнопка квиза</div>
              <div>
                <div style={fieldLabel}>Заголовок</div>
                <input type="text" value={btnText} onChange={(e) => setBtnText(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Подтекст</span>
                  <span onClick={() => setShowSub((v) => !v)} style={{ cursor: "pointer" }}><Toggle on={showSub} small /></span>
                </div>
                <input type="text" value={btnSub} onChange={(e) => setBtnSub(e.target.value)} style={inputStyle} />
              </div>
              <Slider label="Ширина" value={btnW} min={120} max={340} valueLabel={`${btnW} px`} onChange={setBtnW} />
              <Slider label="Высота" value={btnH} min={40} max={88} valueLabel={`${btnH} px`} onChange={setBtnH} />
              <Slider label="Скругление" value={btnR} min={0} max={44} valueLabel={`${btnR} px`} onChange={setBtnR} />
              <Swatches label="Фон кнопки" colors={["#28559c", "#111827", "#166534", "#c2410c", "#ffffff"]} active={btnBg} onPick={setBtnBg} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "#374151" }}>Иконка / картинка</span>
                <span onClick={() => setBtnImg((v) => !v)} style={{ cursor: "pointer" }}><Toggle on={btnImg} /></span>
              </div>
              <div>
                <div style={fieldLabel}>Положение на сайте</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, background: "#F5F5F5", borderRadius: 12, padding: 8 }}>
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} onClick={() => setBtnPos(i)} style={{ height: 22, borderRadius: 7, cursor: "pointer", background: btnPos === i ? "rgba(40,85,156,0.15)" : "#ffffff", border: `1.5px solid ${btnPos === i ? "#28559c" : "#e5e7eb"}`, boxSizing: "border-box", transition: "background .15s" }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === "display" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Показ квиза</div>
              <div>
                <div style={fieldLabel}>Формат по умолчанию</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Попап по кнопке", "Встроенный"].map((label, i) => (
                    <span key={label} onClick={() => setDispType(i)} style={{ flex: 1, textAlign: "center", ...chipStyle(dispType === i), padding: "7px 0" }}>{label}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>Когда показывать</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["По клику на кнопку", "Спустя время на сайте", "Сразу на странице"].map((label, i) => (
                    <span key={label} onClick={() => setTrigger(i)} style={{ ...chipStyle(trigger === i), borderRadius: 12, padding: "8px 12px", textAlign: "left" }}>{label}</span>
                  ))}
                </div>
                {trigger === 1 && (
                  <div style={{ marginTop: 10 }}>
                    <Slider label="Задержка" value={delaySec} min={3} max={120} valueLabel={`${delaySec} сек`} onChange={setDelaySec} />
                  </div>
                )}
                {trigger === 2 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={fieldLabel}>Адрес страницы</div>
                    <input type="text" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} style={{ ...inputStyle, fontFamily: "ui-monospace,Menlo,monospace" }} />
                  </div>
                )}
              </div>
              <div>
                <div style={fieldLabel}>Анимация появления</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Фейд", "Зум", "Снизу", "Флип"].map((label, i) => (
                    <span key={label} onClick={() => setOpenAnim(i)} style={{ ...chipStyle(openAnim === i), padding: "7px 13px" }}>{label}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>Смена слайдов · наведите для превью</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {["Фейд", "Слайд", "Снизу", "Зум", "Флип"].map((label, i) => (
                    <span key={label} onClick={() => setSlideAnim(i)} className="qv-slideanim" style={{ border: `1.5px solid ${slideAnim === i ? "#28559c" : "#ececec"}`, borderRadius: 12, padding: "10px 6px", fontSize: 11.5, fontWeight: 500, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, color: "#374151" }}>
                      <span style={{ width: 34, height: 22, borderRadius: 5, background: "rgba(40,85,156,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <span style={{ width: 18, height: 12, borderRadius: 3, background: "#28559c", ["--sa" as string]: slideAnimNames[i] } as CSSProperties} />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <Slider label="Затемнение фона" value={dim} min={0} max={85} valueLabel={`${dim}%`} onChange={setDim} />
              <div>
                <div style={fieldLabel}>Фон за попапом</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {popupBgList.map((pb, i) => (
                    <span key={pb.label} onClick={() => setPopupBg(i)} style={{ flex: 1, height: 40, borderRadius: 10, cursor: "pointer", background: pb.css === "transparent" ? "#ffffff" : pb.css, outline: popupBg === i ? "2px solid #28559c" : "none", outlineOffset: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 600, color: pb.labelColor, boxSizing: "border-box", border: "1px solid #e5e7eb" }}>{pb.label}</span>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Прогресс-бар квиза</span>
                  <span onClick={() => setProgressOn((v) => !v)} style={{ cursor: "pointer" }}><Toggle on={progressOn} /></span>
                </div>
                {progressOn && (
                  <>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      {["Линия", "Шаги", "Процент"].map((label, i) => (
                        <span key={label} onClick={() => setPrStyle(i)} style={{ flex: 1, textAlign: "center", ...chipStyle(prStyle === i), padding: "7px 0", fontSize: 11.5 }}>{label}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["#28559c", "#111827", "#166534", "#c2410c"].map((v) => (
                        <span key={v} onClick={() => setPrColor(v)} style={{ width: 24, height: 24, borderRadius: 9999, cursor: "pointer", background: v, border: "1px solid #e5e7eb", boxSizing: "border-box", outline: prColor === v ? "2px solid #28559c" : "none", outlineOffset: 2 }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function SiteMock({ children, trigPage = "" }: { children: ReactNode; trigPage?: string }) {
  return (
    <div style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 12px 40px rgba(17,24,39,0.08)", width: 760, maxWidth: "100%", height: 500, position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e5e7eb" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e5e7eb" }} />
          <span style={{ fontSize: 11, color: "#c4c8cf", marginLeft: 8 }}>ваш-сайт.ру{trigPage}</span>
        </div>
        <Bar w="45%" /><Bar w="70%" /><Bar w="55%" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}><div style={{ height: 72, background: "#f7f7f7", borderRadius: 12 }} /><div style={{ height: 72, background: "#f7f7f7", borderRadius: 12 }} /></div>
        <Bar w="62%" />
      </div>
      {children}
    </div>
  );
}
function Bar({ w }: { w: string }) { return <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5, width: w }} />; }
function Corner({ style }: { style: CSSProperties }) { return <span style={{ position: "absolute", width: 8, height: 8, background: "#ffffff", border: "1.5px solid #28559c", borderRadius: 2, zIndex: 2, ...style }} />; }
function AnalyticsIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28559c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }

function Toggle({ on, small }: { on: boolean; small?: boolean }) {
  const w = small ? 30 : 34, knob = small ? 14 : 16, right = w - knob - 2;
  return (
    <span style={{ width: w, height: small ? 18 : 20, borderRadius: 9999, background: on ? "#28559c" : "#d1d5db", position: "relative", transition: "background .2s", flexShrink: 0, display: "inline-block" }}>
      <span style={{ position: "absolute", top: 2, left: on ? right : 2, width: knob, height: knob, borderRadius: 9999, background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
    </span>
  );
}

function Slider({ label, value, min, max, valueLabel, onChange }: { label: string; value: number; min: number; max: number; valueLabel: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}><span>{label}</span><b style={{ color: "#111827" }}>{valueLabel}</b></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", accentColor: "#28559c" }} />
    </div>
  );
}

function Swatches({ label, colors, active, onPick }: { label: string; colors: string[]; active: string; onPick: (v: string) => void }) {
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {colors.map((v) => (
          <span key={v} onClick={() => onPick(v)} style={{ width: 24, height: 24, borderRadius: 9999, cursor: "pointer", background: v, border: "1px solid #e5e7eb", boxSizing: "border-box", outline: active === v ? "2px solid #28559c" : "none", outlineOffset: 2 }} />
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ style, color }: { style: number; color: string }) {
  if (style === 1) {
    return (
      <div style={{ display: "flex", gap: 5 }}>
        {[1, 0, 0, 0, 0, 0].map((on, i) => (
          <span key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: on ? color : "#eceef2" }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 999, background: "#eceef2", overflow: "hidden" }}>
        <div style={{ width: "17%", height: "100%", borderRadius: 999, background: color }} />
      </div>
      {style === 2 && <span style={{ fontSize: 10.5, fontWeight: 700, color }}>17%</span>}
    </div>
  );
}

const panelLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 6px 8px" };
const fieldLabel: CSSProperties = { fontSize: 12, color: "#6b7280", marginBottom: 8 };
const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 12, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outlineColor: "#28559c" };
const segStyle = (active: boolean): CSSProperties => ({ borderRadius: 9999, padding: "6px 16px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: active ? "#ffffff" : "transparent", color: active ? "#111827" : "#6b7280", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "background .2s", whiteSpace: "nowrap" });
const chipStyle = (active: boolean): CSSProperties => ({ border: `1px solid ${active ? "#28559c" : "#e5e7eb"}`, background: active ? "rgba(40,85,156,0.08)" : "#ffffff", color: active ? "#28559c" : "#374151", borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: "pointer" });
