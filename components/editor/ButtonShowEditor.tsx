"use client";

import { useState, type CSSProperties } from "react";
import { ANIM_KEYFRAME, OPEN_ANIM_LABELS, POPUP_POS_LABELS, SLIDE_ANIM_LABELS, type QuizSettings } from "@/lib/quiz/doc";
import { Chips, ColorRow, Field, MultiUpload, Section, Segmented, Slider, Toggle } from "./controls";

const POPUP_BGS: [string, string][] = [
  ["transparent", "Нет"],
  ["linear-gradient(120deg,#28559c,#5a8cd2)", "Градиент"],
  ["linear-gradient(135deg,#1c2c47,#3f5e8f)", "Тёмный"],
];

export function ButtonShowEditor({ settings, onButton, onDisplay, onAnim }: {
  settings: QuizSettings;
  onButton: (p: Partial<QuizSettings["button"]>) => void;
  onDisplay: (p: Partial<QuizSettings["display"]>) => void;
  onAnim: (p: Partial<Pick<QuizSettings, "slideAnim" | "openAnim">>) => void;
}) {
  const b = settings.button;
  const d = settings.display;
  const [replay, setReplay] = useState(0);

  const col = b.position % 3, row = Math.floor(b.position / 3);
  const justify = ["flex-start", "center", "flex-end"][col];
  const align = ["flex-start", "center", "flex-end"][row];
  const btnColor = b.bg === "#ffffff" ? "#28559c" : b.color;

  const buttonEl = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, boxSizing: "border-box", padding: "0 20px", boxShadow: "0 8px 28px rgba(40,85,156,0.35)", width: b.fullscreen ? "100%" : b.width, height: b.height, borderRadius: b.fullscreen ? 0 : b.radius, background: b.bg, color: btnColor, justifyContent: "center" }}>
      {b.icon && <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}><rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="currentColor" opacity="0.5" /><rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="currentColor" opacity="0.75" /><rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="currentColor" /></svg>}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.text}</span>
        {b.showSub && <span style={{ display: "block", fontSize: 11, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.sub}</span>}
      </span>
    </div>
  );

  const openKf = ANIM_KEYFRAME[settings.openAnim];
  const slideKf = ANIM_KEYFRAME[settings.slideAnim];

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {/* Controls */}
      <div style={{ width: 320, flexShrink: 0, background: "#fff", borderRight: "1px solid #e9e9e9", overflowY: "auto", padding: "18px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Кнопка квиза и показ</div>

        <Section title="Кнопка">
          <Field label="Заголовок"><input value={b.text} onChange={(e) => onButton({ text: e.target.value })} style={inp} /></Field>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 11.5, color: "#6b7280" }}>Подтекст</span>
              <Toggle on={b.showSub} onClick={() => onButton({ showSub: !b.showSub })} />
            </div>
            <input value={b.sub} onChange={(e) => onButton({ sub: e.target.value })} style={inp} />
          </div>
          <ColorRow label="Фон кнопки" value={b.bg} onChange={(v) => onButton({ bg: v })} />
          <ColorRow label="Цвет текста" value={b.color} onChange={(v) => onButton({ color: v })} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#374151" }}>Иконка</span>
            <Toggle on={b.icon} onClick={() => onButton({ icon: !b.icon })} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#374151" }}>Во всю ширину (полоса)</span>
            <Toggle on={b.fullscreen} onClick={() => onButton({ fullscreen: !b.fullscreen })} />
          </div>
          {!b.fullscreen && <>
            <Slider label="Ширина" v={b.width} min={120} max={360} unit="px" onChange={(v) => onButton({ width: v })} />
            <Slider label="Скругление" v={b.radius} min={0} max={44} unit="px" onChange={(v) => onButton({ radius: v })} />
          </>}
          <Slider label="Высота" v={b.height} min={40} max={96} unit="px" onChange={(v) => onButton({ height: v })} />
          {!b.fullscreen && (
            <div>
              <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>Положение на сайте</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, background: "#F5F5F5", borderRadius: 12, padding: 8 }}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} onClick={() => onButton({ position: i })} style={{ height: 22, borderRadius: 7, cursor: "pointer", background: b.position === i ? "rgba(40,85,156,0.15)" : "#fff", border: `1.5px solid ${b.position === i ? "#28559c" : "#e5e7eb"}`, boxSizing: "border-box" }} />
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Показ">
          <Field label="Формат"><Segmented value={d.mode} onChange={(v) => onDisplay({ mode: v as "popup" | "embedded" })} options={[["popup", "Попап"], ["embedded", "Встроенный"]]} /></Field>
          <Field label="Когда показывать"><Chips value={d.trigger} onChange={(v) => onDisplay({ trigger: v as QuizSettings["display"]["trigger"] })} options={[["click", "По клику"], ["time", "Через время"], ["page", "На странице"]]} /></Field>
          {d.trigger === "time" && <Slider label="Задержка" v={d.delaySec} min={3} max={120} unit=" сек" onChange={(v) => onDisplay({ delaySec: v })} />}
          {d.trigger === "page" && <Field label="Адрес страницы"><input value={d.pageUrl} onChange={(e) => onDisplay({ pageUrl: e.target.value })} style={{ ...inp, fontFamily: "monospace" }} /></Field>}
          <Field label="Где открывается окно"><Chips value={d.position || "center"} onChange={(v) => onDisplay({ position: v as QuizSettings["display"]["position"] })} options={POPUP_POS_LABELS} /></Field>
          <Slider label="Затемнение фона" v={d.dim} min={0} max={85} unit="%" onChange={(v) => onDisplay({ dim: v })} />
          <div>
            <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>Фон за попапом</div>
            <div style={{ display: "flex", gap: 6 }}>
              {POPUP_BGS.map(([css, label]) => (
                <span key={label} onClick={() => onDisplay({ popupBg: css })} style={{ flex: 1, height: 38, borderRadius: 10, cursor: "pointer", background: css === "transparent" ? "#fff" : css, outline: d.popupBg === css ? "2px solid #28559c" : "none", outlineOffset: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 600, color: css === "transparent" ? "#374151" : "#fff", border: "1px solid #e5e7eb", boxSizing: "border-box" }}>{label}</span>
              ))}
            </div>
          </div>
          <Field label="Картинки за попапом (файлы, >1 = слайдер)"><MultiUpload images={d.popupImages || []} onChange={(imgs) => onDisplay({ popupImages: imgs })} /></Field>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Прогресс-бар</span>
            <Toggle on={d.progressOn} onClick={() => onDisplay({ progressOn: !d.progressOn })} />
          </div>
          {d.progressOn && <>
            <Chips value={d.progressStyle} onChange={(v) => onDisplay({ progressStyle: v as QuizSettings["display"]["progressStyle"] })} options={[["line", "Линия"], ["steps", "Шаги"], ["percent", "Процент"]]} />
            <ColorRow label="Цвет прогресса" value={d.progressColor} onChange={(v) => onDisplay({ progressColor: v })} />
          </>}
        </Section>

        <Section title="Анимации">
          <Field label="Появление попапа"><Chips value={settings.openAnim} onChange={(v) => { onAnim({ openAnim: v as QuizSettings["openAnim"] }); setReplay((r) => r + 1); }} options={OPEN_ANIM_LABELS} /></Field>
          <Field label="Переключение слайдов"><Chips value={settings.slideAnim} onChange={(v) => { onAnim({ slideAnim: v as QuizSettings["slideAnim"] }); setReplay((r) => r + 1); }} options={SLIDE_ANIM_LABELS} /></Field>
        </Section>
      </div>

      {/* Preview */}
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 24px" }}>
        {/* Site mock with button */}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Кнопка на сайте · позиция и стиль</div>
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 12px 40px rgba(17,24,39,0.08)", height: 320, position: "relative", overflow: "hidden" }}>
            <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 10, height: 10, borderRadius: 999, background: "#e5e7eb" }} /><span style={{ width: 10, height: 10, borderRadius: 999, background: "#e5e7eb" }} /><span style={{ fontSize: 11, color: "#c4c8cf", marginLeft: 8 }}>ваш-сайт.ру</span></div>
              {["45%", "70%", "55%"].map((w, i) => <div key={i} style={{ height: 10, background: "#f0f0f0", borderRadius: 5, width: w }} />)}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}><div style={{ height: 60, background: "#f7f7f7", borderRadius: 12 }} /><div style={{ height: 60, background: "#f7f7f7", borderRadius: 12 }} /></div>
            </div>
            {b.fullscreen
              ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>{buttonEl}</div>
              : <div style={{ position: "absolute", inset: 0, display: "flex", padding: 18, boxSizing: "border-box", pointerEvents: "none", justifyContent: justify, alignItems: align }}>{buttonEl}</div>}
          </div>
        </div>

        {/* Popup preview */}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Попап · анимация появления и слайдов</div>
            <div onClick={() => setReplay((r) => r + 1)} style={{ fontSize: 12, fontWeight: 500, color: "#28559c", cursor: "pointer", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "5px 12px" }}>▶ Проиграть</div>
          </div>
          <div style={{ borderRadius: 20, height: 340, position: "relative", overflow: "hidden", background: (d.popupImages && d.popupImages.length) ? undefined : d.popupBg === "transparent" ? "#eef1f6" : d.popupBg }}>
            {d.popupImages && d.popupImages.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.popupImages[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, padding: 20, boxSizing: "border-box", background: `rgba(15,23,42,${(d.dim / 100).toFixed(2)})`, display: "flex", alignItems: posAlign(d.position).v, justifyContent: posAlign(d.position).h }}>
              <div key={`pop-${replay}`} style={{ background: "#fff", borderRadius: 16, width: 300, padding: 22, boxSizing: "border-box", boxShadow: "0 24px 64px rgba(15,23,42,0.35)", animation: openKf ? `${openKf} .55s cubic-bezier(.2,.8,.3,1)` : undefined }}>
                {d.progressOn && <div style={{ marginBottom: 14 }}><ProgressPreview style={d.progressStyle} color={d.progressColor} /></div>}
                <div key={`slide-${replay}`} style={{ animation: slideKf ? `${slideKf} .5s cubic-bezier(.2,.8,.3,1)` : undefined }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Пример вопроса</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 10px", fontSize: 11.5 }}>Вариант A</div>
                    <div style={{ border: `1px solid ${settings.button.bg}`, background: "rgba(40,85,156,0.05)", borderRadius: 10, padding: "9px 10px", fontSize: 11.5 }}>Вариант B</div>
                  </div>
                  <div style={{ background: settings.button.bg, color: "#fff", borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 500, textAlign: "center", marginTop: 12 }}>Далее →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function posAlign(p?: string): { v: string; h: string } {
  switch (p) {
    case "br": return { v: "flex-end", h: "flex-end" };
    case "bl": return { v: "flex-end", h: "flex-start" };
    case "tr": return { v: "flex-start", h: "flex-end" };
    case "tl": return { v: "flex-start", h: "flex-start" };
    default: return { v: "center", h: "center" };
  }
}

function ProgressPreview({ style, color }: { style: string; color: string }) {
  if (style === "steps") {
    return <div style={{ display: "flex", gap: 5 }}>{[1, 0, 0, 0, 0].map((on, i) => <span key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: on ? color : "#eceef2" }} />)}</div>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 999, background: "#eceef2", overflow: "hidden" }}><div style={{ width: "20%", height: "100%", borderRadius: 999, background: color }} /></div>
      {style === "percent" && <span style={{ fontSize: 10.5, fontWeight: 700, color }}>20%</span>}
    </div>
  );
}

const inp: CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", color: "#111827", outlineColor: "#28559c" };
