import { Container } from "../site/Container";
import { ArrowButton } from "../site/primitives";
import { SectionBadge } from "./SectionBadge";
import { routes } from "@/lib/nav";

const bullets = [
  "Любые поля формы: телефон, почта, дата, файлы — и собственные поля любых типов",
  "Обложка квиза — свободный первый экран: заголовок, описание, преимущества — двигайте как нужно",
  "Адаптивность из коробки: квиз одинаково аккуратен на телефоне и десктопе",
];

export function EditorSection() {
  return (
    <div style={{ background: "#E8EDF6", padding: "112px 0" }} data-screen-label="Редактор">
      <Container>
        <SectionBadge number={3} label="Редактор" />
        <h2
          style={{
            margin: "0 0 64px",
            fontSize: "clamp(1.5rem,4vw,3.2rem)",
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          Экран квиза собирается<br />как конструктор.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(400px,100%),1fr))",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 28px",
                fontSize: 17,
                lineHeight: 1.65,
                color: "#111827",
                fontWeight: 500,
                textWrap: "pretty",
              }}
            >
              Перетаскивайте блоки прямо на экране, задавайте ширину и высоту, бордеры, цвета и шрифты —
              без кода и дизайнера.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 15, color: "#4b5563" }}>
              {bullets.map((b) => (
                <div key={b} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span style={{ color: "#28559c", fontWeight: 600 }}>—</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <ArrowButton href={routes.editor} style={{ marginTop: 36 }}>
              Попробовать редактор
            </ArrowButton>
          </div>

          <EditorMock />
        </div>
      </Container>
    </div>
  );
}

function EditorMock() {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 12px 40px rgba(17,24,39,0.08)",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Dot />
        <Dot />
        <Dot />
        <span style={{ marginLeft: 12, fontSize: 12, color: "#9ca3af" }}>
          Редактор Квалифай — «Подбор кухни»
        </span>
      </div>
      <div className="qv-editor-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px" }}>
        {/* Canvas */}
        <div style={{ padding: 28, background: "linear-gradient(180deg,#fafafa,#ffffff)" }}>
          <div
            style={{
              position: "relative",
              border: "1.5px solid #28559c",
              borderRadius: 12,
              padding: 22,
              background: "#ffffff",
            }}
          >
            <Handle style={{ left: -5, top: -5 }} />
            <Handle style={{ right: -5, top: -5 }} />
            <Handle style={{ left: -5, bottom: -5 }} />
            <Handle style={{ right: -5, bottom: -5 }} />
            <span
              style={{
                position: "absolute",
                top: -12,
                left: 16,
                background: "#28559c",
                color: "#ffffff",
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 9px",
                borderRadius: 9999,
              }}
            >
              Заголовок · перетащите
            </span>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Рассчитайте стоимость кухни за 1 минуту
            </div>
          </div>
          <div
            style={{
              border: "1px dashed #d1d5db",
              borderRadius: 12,
              padding: "16px 22px",
              marginTop: 14,
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            Ответьте на 5 вопросов — получите смету и скидку 10%
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #28559c", flexShrink: 0 }} />
              Прямая
            </div>
            <div
              style={{
                border: "1px solid #28559c",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(40,85,156,0.05)",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "4.5px solid #28559c",
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              />
              Угловая
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <div
              style={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              +7 (___) ___-__-__
            </div>
            <div
              style={{
                background: "#28559c",
                color: "#ffffff",
                borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Далее
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div
          className="qv-editor-panel"
          style={{
            borderLeft: "1px solid #f0f0f0",
            padding: "20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 600, color: "#111827" }}>Блок: Заголовок</div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Ширина</div>
            <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: 4, width: "72%", background: "#28559c", borderRadius: 2 }} />
              <div
                style={{
                  position: "absolute",
                  left: "72%",
                  top: -4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "2px solid #28559c",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Цвет</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#111827", outline: "2px solid #28559c", outlineOffset: 2 }} />
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#28559c" }} />
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#6b7280" }} />
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#ffffff", border: "1px solid #e5e7eb", boxSizing: "border-box" }} />
            </div>
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Бордер</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px" }}>Нет</span>
              <span style={{ border: "1px solid #28559c", borderRadius: 6, padding: "4px 8px", color: "#28559c" }}>1 px</span>
              <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px" }}>2 px</span>
            </div>
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Шрифт</div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "7px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>System · 19 px</span>
              <span style={{ color: "#9ca3af" }}>▾</span>
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              border: "1px dashed #d1d5db",
              borderRadius: 8,
              padding: "8px 10px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            + Своё поле
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e5e7eb" }} />;
}

function Handle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      style={{
        position: "absolute",
        width: 8,
        height: 8,
        background: "#ffffff",
        border: "1.5px solid #28559c",
        borderRadius: 2,
        ...style,
      }}
    />
  );
}
