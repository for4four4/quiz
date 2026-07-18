import { Container } from "../site/Container";
import { SectionBadge } from "./SectionBadge";

const checklist = [
  ["Обложка", "— заголовок, описание и преимущества"],
  ["5 вопросов", "— с вариантами ответов и логикой ветвления"],
  ["Калькулятор стоимости", "— по ответам клиента"],
  ["Форма контактов", "— со скидкой за прохождение"],
];

const bullets = [
  "Готовый черновик за минуту вместо часа работы",
  "Тексты под вашу аудиторию, а не шаблонные формулировки",
  "Каждый сгенерированный блок редактируется как обычный",
];

export function AiSection() {
  return (
    <div style={{ background: "#0F1F3C", padding: "112px 0" }} data-screen-label="ИИ-генерация">
      <Container>
        <SectionBadge number={2} label="ИИ-генерация" variant="dark" />
        <h2
          style={{
            margin: "0 0 64px",
            fontSize: "clamp(1.5rem,4vw,3.2rem)",
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          Опишите бизнес одной фразой —<br />ИИ соберёт квиз целиком.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(400px,100%),1fr))",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Generator card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 12px 40px rgba(17,24,39,0.08)",
              padding: 32,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  flex: 1,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "0 16px",
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 14,
                  color: "#111827",
                  boxSizing: "border-box",
                }}
              >
                Студия кухонь на заказ, нужен расчёт стоимости со скидкой
              </div>
              <div
                style={{
                  background: "#28559c",
                  color: "#ffffff",
                  borderRadius: 12,
                  padding: "0 20px",
                  height: 46,
                  fontSize: 14,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  flexShrink: 0,
                  boxSizing: "border-box",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: "block", flexShrink: 0 }}
                >
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                </svg>
                <span style={{ lineHeight: 1 }}>Сгенерировать</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              {checklist.map(([bold, rest]) => (
                <div
                  key={bold}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: "1px solid #f0f0f0",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 13.5,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#166534"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    <b style={{ fontWeight: 600 }}>{bold}</b> {rest}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Copy */}
          <div>
            <p
              style={{
                margin: "0 0 28px",
                fontSize: 17,
                lineHeight: 1.65,
                fontWeight: 500,
                textWrap: "pretty",
                color: "#ffffff",
              }}
            >
              Нужен квиз быстро — не собирайте его руками. ИИ напишет вопросы, обложку и логику под
              вашу нишу, а вы доведёте до идеала в редакторе.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                fontSize: 15,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {bullets.map((b) => (
                <div key={b} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span style={{ color: "#8fb4ea", fontWeight: 600 }}>—</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
