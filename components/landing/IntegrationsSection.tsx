import type { ReactNode } from "react";
import { Container } from "../site/Container";
import { SectionBadge } from "./SectionBadge";

export function IntegrationsSection() {
  return (
    <div style={{ background: "#DFE7F3", padding: "112px 0" }} data-screen-label="Установка и интеграции">
      <Container>
        <SectionBadge number={5} label="Установка и интеграции" />
        <h2
          style={{
            margin: "0 0 64px",
            fontSize: "clamp(1.5rem,4vw,3.2rem)",
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          Квиз встаёт на любой сайт.<br />Заявки попадают туда, где вы работаете.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(360px,100%),1fr))",
            gap: 28,
          }}
        >
          {/* CSS selector card */}
          <div style={{ background: "#ffffff", borderRadius: 20, padding: 36 }}>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>
              Встраивание по CSS-селектору
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.6, color: "#4b5563", minHeight: 45 }}>
              Укажите селектор блока на вашем сайте — скрипт Квалифай сам встроит квиз в нужное место.
            </p>
            <div
              style={{
                background: "#111827",
                borderRadius: 12,
                padding: "18px 20px",
                fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
                fontSize: 12.5,
                lineHeight: 1.7,
                color: "#9ca3af",
                overflow: "auto",
              }}
            >
              <div>
                <span style={{ color: "#6b7280" }}>&lt;script</span>{" "}
                <span style={{ color: "#93b4e0" }}>src</span>=
                <span style={{ color: "#a7c98f" }}>&quot;https://qvalify.ru/embed.js&quot;</span>
              </div>
              <div style={{ paddingLeft: 16 }}>
                <span style={{ color: "#93b4e0" }}>data-quiz</span>=
                <span style={{ color: "#a7c98f" }}>&quot;kitchen-calc&quot;</span>
              </div>
              <div style={{ paddingLeft: 16 }}>
                <span style={{ color: "#93b4e0" }}>data-selector</span>=
                <span style={{ color: "#a7c98f" }}>&quot;#quiz-block&quot;</span>
                <span style={{ color: "#6b7280" }}>&gt;&lt;/script&gt;</span>
              </div>
            </div>
          </div>

          {/* Floating button card */}
          <div style={{ background: "#ffffff", borderRadius: 20, padding: 36, position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>
              Плавающая кнопка
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.6, color: "#4b5563", minHeight: 45 }}>
              Кнопка закреплена на страницах сайта и настраивается полностью: картинка, размер, цвет,
              шрифт, положение.
            </p>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                height: 150,
                position: "relative",
                boxShadow: "inset 0 0 0 1px #e5e7eb",
              }}
            >
              <div style={{ position: "absolute", left: 18, top: 18, right: 120 }}>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, width: "60%" }} />
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, width: "85%", marginTop: 8 }} />
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, width: "70%", marginTop: 8 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  bottom: 16,
                  background: "#28559c",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 9999,
                  padding: "10px 18px",
                  boxShadow: "0 6px 20px rgba(40,85,156,0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="#ffffff" opacity="0.55" />
                  <rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="#ffffff" opacity="0.8" />
                  <rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="#ffffff" />
                </svg>
                Пройти квиз
              </div>
            </div>
          </div>
        </div>

        {/* Integration chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <Chip>
            <span
              style={{
                width: 19,
                height: 19,
                borderRadius: 5,
                background: "#1f3c6e",
                color: "#ffffff",
                fontSize: 7,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              amo
            </span>
            amoCRM
          </Chip>
          <Chip>
            <span
              style={{
                width: 19,
                height: 19,
                borderRadius: 5,
                background: "#0aa9e0",
                color: "#ffffff",
                fontSize: 8.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              24
            </span>
            Битрикс24
          </Chip>
          <Chip>
            <ChipImg src="/uploads/telegram.svg" />
            Telegram
          </Chip>
          <Chip>
            <ChipImg src="/uploads/max.svg" />
            MAX
          </Chip>
          <Chip>
            <ChipImg src="/uploads/vk.svg" radius={5} />
            ВКонтакте
          </Chip>
          <Chip>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#28559c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 1 1 8.6 14.2" />
              <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
              <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
            </svg>
            Вебхуки
          </Chip>
          <Chip>
            <ChipImg src="/uploads/yandex-metrika.svg" />
            Яндекс.Метрика
          </Chip>
          <Chip>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#28559c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Коллтрекинг
          </Chip>
        </div>
      </Container>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 9999,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

function ChipImg({ src, radius = 0 }: { src: string; radius?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={{ width: 19, height: 19, borderRadius: radius, flexShrink: 0 }} />;
}
