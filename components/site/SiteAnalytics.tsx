"use client";

import { useEffect } from "react";

// Подключает счётчики Яндекс.Метрики и Google Analytics ТОЛЬКО после согласия
// на cookie ("all"). Слушает событие qv-cookie-consent, чтобы подключиться
// сразу после нажатия «Принять» без перезагрузки.
export function SiteAnalytics({ metrikaId, gaId }: { metrikaId?: string; gaId?: string }) {
  useEffect(() => {
    if (!metrikaId && !gaId) return;
    let done = false;

    const inject = () => {
      if (done) return;
      let consent = "";
      try { consent = localStorage.getItem("qv_cookie_consent") || ""; } catch { /* ignore */ }
      if (consent !== "all") return;
      done = true;

      if (metrikaId) {
        const w = window as unknown as { ym?: (...a: unknown[]) => void };
        if (!w.ym) {
          const stub = function (...a: unknown[]) { ((stub as unknown as { a: unknown[] }).a = (stub as unknown as { a?: unknown[] }).a || []).push(a); };
          w.ym = stub as unknown as (...a: unknown[]) => void;
          const s = document.createElement("script");
          s.async = true; s.src = "https://mc.yandex.ru/metrika/tag.js";
          document.head.appendChild(s);
        }
        w.ym!(Number(metrikaId), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
      }

      if (gaId) {
        const s = document.createElement("script");
        s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
        document.head.appendChild(s);
        const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
        w.dataLayer = w.dataLayer || [];
        w.gtag = function (...a: unknown[]) { w.dataLayer!.push(a); };
        w.gtag("js", new Date());
        w.gtag("config", gaId);
      }
    };

    inject();
    const onConsent = () => inject();
    window.addEventListener("qv-cookie-consent", onConsent);
    return () => window.removeEventListener("qv-cookie-consent", onConsent);
  }, [metrikaId, gaId]);

  return null;
}
