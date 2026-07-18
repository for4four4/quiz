import { Nav } from "../site/Nav";
import { ArrowButton } from "../site/primitives";
import { HeroDemo } from "./HeroDemo";
import { routes } from "@/lib/nav";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Hero() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#E8EDF6",
      }}
      data-screen-label="Hero"
    >
      {/* Drifting gradient blobs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <Blob
          style={{
            width: "70vw",
            height: "70vw",
            left: "-15vw",
            top: "-25vw",
            background: "radial-gradient(circle,rgba(37,99,214,0.98),rgba(37,99,214,0) 64%)",
            filter: "blur(32px)",
            animation: "qvDrift1 6.5s ease-in-out infinite",
          }}
        />
        <Blob
          style={{
            width: "60vw",
            height: "60vw",
            right: "-18vw",
            top: 0,
            background: "radial-gradient(circle,rgba(110,163,240,0.95),rgba(120,165,225,0) 64%)",
            filter: "blur(36px)",
            animation: "qvDrift2 8s ease-in-out infinite",
          }}
        />
        <Blob
          style={{
            width: "55vw",
            height: "55vw",
            left: "20vw",
            bottom: "-28vw",
            background: "radial-gradient(circle,rgba(18,63,140,0.9),rgba(18,63,140,0) 62%)",
            filter: "blur(40px)",
            animation: "qvDrift3 7s ease-in-out infinite, qvPulse 5s ease-in-out infinite",
          }}
        />
        <Blob
          style={{
            width: "48vw",
            height: "48vw",
            left: "34vw",
            top: "8vh",
            background: "radial-gradient(circle,rgba(255,255,255,1),rgba(255,255,255,0) 70%)",
            filter: "blur(28px)",
            animation: "qvDrift4 7.5s ease-in-out infinite",
          }}
        />
        <Blob
          style={{
            width: "40vw",
            height: "40vw",
            right: "8vw",
            bottom: "-14vw",
            background: "radial-gradient(circle,rgba(64,132,244,0.9),rgba(64,132,244,0) 64%)",
            filter: "blur(34px)",
            animation: "qvDrift2 5.5s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(31deg,rgba(255,255,255,0.5) 0px,rgba(255,255,255,0) 4px,rgba(255,255,255,0) 12px)",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {/* Grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0.05,
          backgroundImage: GRAIN,
        }}
      />

      <Nav />

      {/* Hero content */}
      <div
        className="qv-hero-grid"
        style={{
          position: "relative",
          zIndex: 20,
          maxWidth: 1440,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          padding: "32px clamp(20px,5vw,48px) 56px",
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, letterSpacing: "0.02em", marginBottom: 28 }}>
            Квалифай — платформа квизов с ИИ-генерацией
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2.2rem,3.5vw,3.6rem)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
          >
            Квизы, которые превращают
            <br />
            посетителей сайта в заявки —
            <br />
            с аналитикой и CRM внутри.
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 40,
              flexWrap: "wrap",
            }}
          >
            <ArrowButton href={routes.editor}>Создать квиз бесплатно</ArrowButton>

            <FeaturePill
              badge="Встроено"
              badgeBg="#111827"
              text="Аналитика на любом тарифе"
              icon={
                <svg width="24" height="24" viewBox="0 0 100 100" style={{ fill: "#28559c", flexShrink: 0 }}>
                  <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
                </svg>
              }
            />
            <FeaturePill
              badge="Новое"
              badgeBg="#28559c"
              text="ИИ соберёт квиз за минуту"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#28559c"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                  <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
                </svg>
              }
            />
          </div>
        </div>

        <HeroDemo />
      </div>
    </div>
  );
}

function Blob({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: "absolute", borderRadius: "50%", ...style }} />;
}

function FeaturePill({
  icon,
  text,
  badge,
  badgeBg,
}: {
  icon: React.ReactNode;
  text: string;
  badge: string;
  badgeBg: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#ffffff",
        borderRadius: 9999,
        padding: "10px 18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {icon}
      <span style={{ fontSize: 14, fontWeight: 500 }}>{text}</span>
      <span
        style={{
          fontSize: 11,
          background: badgeBg,
          color: "#ffffff",
          padding: "2px 9px",
          borderRadius: 9999,
        }}
      >
        {badge}
      </span>
    </div>
  );
}
