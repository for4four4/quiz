"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { navLinks, routes } from "@/lib/nav";

// Мобильное меню сайта: кнопка-бургер (видна ≤960px через .qv-burger) + выезжающая
// панель со ссылками. Панель портируется в document.body, чтобы не попадать в
// stacking-context трансформированных предков (иначе контент «просвечивает»).
export function NavMobile({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const close = () => setOpen(false);

  const drawer = (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 2147483000 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(300px,84vw)", background: "#fff", zIndex: 2147483001, boxShadow: "-12px 0 40px rgba(15,31,60,0.18)", padding: "18px 18px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", fontFamily: "-apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
          <button aria-label="Закрыть" onClick={close} style={{ width: 36, height: 36, borderRadius: 9999, border: "none", background: "#F5F5F5", color: "#374151", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        {navLinks.map((l) => (
          <Link key={l.href} href={l.href} onClick={close} style={{ padding: "12px 12px", borderRadius: 12, fontSize: 15, fontWeight: 500, color: active === l.href ? "#28559c" : "#111827", background: active === l.href ? "rgba(40,85,156,0.08)" : "transparent", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
        <div style={{ height: 1, background: "#f0f0f0", margin: "8px 0" }} />
        <Link href={routes.vhod} onClick={close} style={{ padding: "12px", borderRadius: 12, fontSize: 15, fontWeight: 500, color: "#111827", textDecoration: "none" }}>Войти</Link>
        <Link href={routes.cabinet} onClick={close} style={{ marginTop: 4, textAlign: "center", background: "#111827", color: "#fff", borderRadius: 9999, padding: "13px 16px", fontSize: 14.5, fontWeight: 600, textDecoration: "none" }}>Создать квиз</Link>
      </div>
    </>
  );

  return (
    <>
      <button
        className="qv-burger"
        aria-label="Меню"
        onClick={() => setOpen(true)}
        style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9999, border: "none", background: "transparent", color: "#111827", cursor: "pointer", flexShrink: 0 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      {open && mounted && createPortal(drawer, document.body)}
    </>
  );
}
