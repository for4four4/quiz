"use client";

import Link from "next/link";
import { useState } from "react";
import { routes } from "@/lib/nav";

const fmt = (n: number) => n.toLocaleString("ru-RU");
const disc = (p: number) => Math.round((p * 0.8) / 10) * 10;

const volumes = [
  { n: 100, p: 1290 },
  { n: 300, p: 2790 },
  { n: 500, p: 3990 },
  { n: 1000, p: 5990 },
  { n: 3000, p: 8490 },
  { n: 5000, p: 11490 },
];
const START_BASE = 590;

const freeFeatures: [boolean, string][] = [
  [true, "Безлимит квизов и проектов"],
  [true, "Полный редактор и ИИ-генерация"],
  [true, "Вся аналитика: Метрика, свой код"],
  [true, "Встроенная CRM для заявок"],
  [false, "Бейдж «Сделано в Квалифай»"],
];
const startFeatures = [
  "Всё из Бесплатного",
  "Все интеграции: CRM, мессенджеры, вебхуки",
  "Коллтрекинг на каждый шаг",
  "Без бейджа Квалифай",
  "Экспорт заявок в CSV",
];
const proFeatures = [
  "Всё из Старта",
  "Команда: приглашения в проект без лимита",
  "Свой домен и загрузка видео",
  "A/B-тесты и динамический контент",
  "Приоритетная поддержка",
];

export function PricingPlans() {
  const [yearly, setYearly] = useState(false);
  const [vol, setVol] = useState(0);

  const startPrice = fmt(yearly ? disc(START_BASE) : START_BASE);
  const proPrice = fmt(yearly ? disc(volumes[vol].p) : volumes[vol].p);

  return (
    <>
      {/* Billing toggle */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 clamp(20px,5vw,48px) 32px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#ffffff",
            borderRadius: 9999,
            padding: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            gap: 2,
          }}
        >
          <button
            onClick={() => setYearly(false)}
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13.5,
              fontWeight: 500,
              borderRadius: 9999,
              padding: "9px 20px",
              background: yearly ? "transparent" : "#111827",
              color: yearly ? "#111827" : "#ffffff",
              transition: "background .3s,color .3s",
            }}
          >
            Помесячно
          </button>
          <button
            onClick={() => setYearly(true)}
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13.5,
              fontWeight: 500,
              borderRadius: 9999,
              padding: "9px 20px",
              background: yearly ? "#111827" : "transparent",
              color: yearly ? "#ffffff" : "#111827",
              transition: "background .3s,color .3s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            На год{" "}
            <span
              style={{
                fontSize: 11,
                background: "#28559c",
                color: "#ffffff",
                padding: "2px 7px",
                borderRadius: 9999,
              }}
            >
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 clamp(20px,5vw,48px) 32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {/* Free */}
          <Card>
            <PlanName>Бесплатный</PlanName>
            <Price>0 ₽</Price>
            <Sub>10 заявок в месяц · навсегда</Sub>
            <Features>
              {freeFeatures.map(([ok, t]) => (
                <Feature key={t} ok={ok}>
                  {t}
                </Feature>
              ))}
            </Features>
            <PlanButton
              variant="outline"
              href={routes.cabinet}
              label="Начать бесплатно"
            />
          </Card>

          {/* Start */}
          <Card>
            <PlanName>Старт</PlanName>
            <Price>{startPrice} ₽</Price>
            <Sub>в месяц · 30 заявок, остаток переносится</Sub>
            <Features>
              {startFeatures.map((t) => (
                <Feature key={t} ok>
                  {t}
                </Feature>
              ))}
            </Features>
            <PlanButton variant="dark" href={routes.cabinet} label="Выбрать Старт" />
          </Card>

          {/* Pro */}
          <div
            style={{
              background: "#28559c",
              color: "#ffffff",
              borderRadius: 20,
              padding: 36,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "26vw",
                height: "26vw",
                right: "-9vw",
                top: "-12vw",
                borderRadius: "50%",
                background: "radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0) 65%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Про</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#ffffff",
                  color: "#28559c",
                  padding: "3px 10px",
                  borderRadius: 9999,
                }}
              >
                Популярный
              </div>
            </div>
            <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {proPrice} ₽
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "10px 0 16px" }}>
              в месяц · заявки не сгорают
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
              {volumes.map((v, i) => (
                <button
                  key={v.n}
                  onClick={() => setVol(i)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.35)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: 500,
                    borderRadius: 9999,
                    padding: "6px 12px",
                    background: i === vol ? "#ffffff" : "transparent",
                    color: i === vol ? "#28559c" : "#ffffff",
                    transition: "background .25s,color .25s",
                  }}
                >
                  {fmt(v.n)}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.9)", flex: 1 }}>
              {proFeatures.map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span>✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <PlanButton variant="light" href={routes.cabinet} label="Выбрать Про" />
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 16 }}>
          Цена за заявку сверх лимита — по тарифу вашего пакета. Квизы продолжают работать, даже если
          лимит закончился.
        </div>
      </div>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: 36,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

function PlanName({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>{children}</div>;
}

function Price({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }}>{children}</div>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: "#6b7280", margin: "10px 0 24px" }}>{children}</div>;
}

function Features({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#374151", flex: 1 }}>
      {children}
    </div>
  );
}

function Feature({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
      <span style={{ color: ok ? "#28559c" : "#9ca3af" }}>{ok ? "✓" : "—"}</span>
      <span style={{ color: ok ? undefined : "#9ca3af" }}>{children}</span>
    </div>
  );
}

function PlanButton({
  variant,
  href,
  label,
}: {
  variant: "outline" | "dark" | "light";
  href: string;
  label: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    outline: { border: "1.5px solid #e5e7eb", color: "#111827", background: "transparent" },
    dark: { background: "#111827", color: "#ffffff" },
    light: { background: "#ffffff", color: "#28559c" },
  };
  return (
    <Link
      href={href}
      className="qv-grp"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 9999,
        padding: "12px 20px",
        marginTop: 28,
        ...styles[variant],
      }}
    >
      <span className="qv-roll" style={{ height: 20 }}>
        <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
          <span>{label}</span>
          <span>{label}</span>
        </span>
      </span>
    </Link>
  );
}
