"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { api } from "@/lib/client/api";

/** Загрузка картинки файлом (не ссылкой): аплоад → возвращает URL. */
export function UploadField({ value, onChange, preview = true }: { value?: string; onChange: (url: string) => void; preview?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setErr("");
    try { const { url } = await api.upload(f); onChange(url); }
    catch (e) { setErr(e instanceof Error ? e.message : "Ошибка загрузки"); }
    finally { setBusy(false); }
  };
  return (
    <div>
      {preview && value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 10, marginBottom: 8, border: "1px solid #e5e7eb" }} />
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
      <div style={{ display: "flex", gap: 8 }}>
        <div onClick={() => ref.current?.click()} style={{ ...btnGhost, flex: 1, textAlign: "center", opacity: busy ? 0.6 : 1 }}>{busy ? "Загрузка…" : value ? "Заменить файл" : "Загрузить файл"}</div>
        {value && <div onClick={() => onChange("")} style={{ ...btnGhost, color: "#991b1b" }}>Убрать</div>}
      </div>
      {err && <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 5 }}>{err}</div>}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}><div style={panelLabel}>{title}</div>{children}</div>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 5 }}>{label}</div>{children}</div>;
}
export function Slider({ label, v, min, max, unit, onChange }: { label: string; v: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#6b7280", marginBottom: 4 }}><span>{label}</span><b style={{ color: "#111827" }}>{v}{unit}</b></div>
      <input type="range" min={min} max={max} value={v} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", accentColor: "#28559c" }} />
    </div>
  );
}
export function ColorRow({ label, value, onChange, extra }: { label: string; value: string; onChange: (v: string) => void; extra?: ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "#6b7280", marginBottom: 5 }}><span>{label}</span>{extra}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} style={{ width: 34, height: 30, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", padding: 2, cursor: "pointer" }} />
        <input value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 12 }} />
      </div>
    </div>
  );
}
export function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ display: "flex", background: "#F5F5F5", borderRadius: 9999, padding: 3 }}>
      {options.map(([val, label]) => (
        <div key={val} onClick={() => onChange(val)} style={{ flex: 1, textAlign: "center", borderRadius: 9999, padding: "6px 0", fontSize: 12, fontWeight: 500, cursor: "pointer", background: value === val ? "#fff" : "transparent", color: value === val ? "#111827" : "#6b7280", boxShadow: value === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{label}</div>
      ))}
    </div>
  );
}
export function Chips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(([val, label]) => (
        <div key={val} onClick={() => onChange(val)} style={{ border: `1px solid ${value === val ? "#28559c" : "#e5e7eb"}`, background: value === val ? "rgba(40,85,156,0.08)" : "#fff", color: value === val ? "#28559c" : "#374151", borderRadius: 9999, padding: "7px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{label}</div>
      ))}
    </div>
  );
}
export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, cursor: "pointer" }}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
}
export function IconBtn({ children, onClick, title, danger }: { children: ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return <span title={title} onClick={onClick} style={{ width: 26, height: 26, borderRadius: 8, background: "#F5F5F5", color: danger ? "#991b1b" : "#6b7280", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{children}</span>;
}
export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{ width: 34, height: 20, borderRadius: 9999, background: on ? "#28559c" : "#d1d5db", position: "relative", transition: "background .2s", cursor: "pointer", flexShrink: 0, display: "inline-block" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 9999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
    </span>
  );
}

export const panelLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" };
export const addRow: CSSProperties = { border: "1px dashed #d1d5db", borderRadius: 12, padding: "9px 12px", fontSize: 12.5, fontWeight: 500, textAlign: "center", color: "#6b7280", cursor: "pointer" };
export const inp: CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", color: "#111827", outlineColor: "#28559c" };
export const ta: CSSProperties = { ...inp, resize: "vertical", lineHeight: 1.4 };
export const btnGhost: CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 9999, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" };
