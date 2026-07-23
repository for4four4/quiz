"use client";

import { useEffect, useState } from "react";

// Баннер согласия на cookie. Выбор хранится в localStorage; аналитические
// счётчики (Метрика/Google) должны подключаться только при значении "all".
const KEY = "qv_cookie_consent"; // "all" | "necessary"

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Не показываем на публичном раннере квиза и клиентских доменах —
      // там своя форма согласия, баннер платформы был бы неуместен.
      const p = window.location.pathname;
      if (p.startsWith("/q/") || p.startsWith("/d/")) return;
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch { /* ignore */ }
  }, []);

  const choose = (value: "all" | "necessary") => {
    try {
      localStorage.setItem(KEY, value);
      // Событие, чтобы загрузчик аналитики мог отреагировать без перезагрузки
      window.dispatchEvent(new CustomEvent("qv-cookie-consent", { detail: value }));
    } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      style={{
        position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 90,
        maxWidth: 720, margin: "0 auto", background: "#0F1F3C", color: "#e8eef8",
        borderRadius: 16, padding: "16px 18px", boxShadow: "0 16px 48px rgba(15,31,60,0.4)",
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
        fontFamily: "-apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ flex: 1, minWidth: 240, fontSize: 13.5, lineHeight: 1.55 }}>
        Мы используем cookie для работы сайта и аналитики. Продолжая, вы соглашаетесь с{" "}
        <a href="/dokumenty#cookie" style={{ color: "#9ec1ff", textDecoration: "underline" }}>Политикой cookie</a>.
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => choose("necessary")}
          style={{ border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "#e8eef8", borderRadius: 9999, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          Только необходимые
        </button>
        <button
          onClick={() => choose("all")}
          style={{ border: "none", background: "#28559c", color: "#fff", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Принять
        </button>
      </div>
    </div>
  );
}
