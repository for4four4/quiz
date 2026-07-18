import { Container } from "../site/Container";
import { Reveal } from "../util/Reveal";
import { SectionBadge } from "./SectionBadge";

const steps = [
  {
    n: "01",
    title: "Приглашение",
    text: "Квиз появляется в нужный момент: встроенный блок, плавающая кнопка или прямая ссылка в рекламе и соцсетях.",
    icon: (
      <>
        <path d="M3 11l18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </>
    ),
  },
  {
    n: "02",
    title: "Вопросы",
    text: "Уточняет потребности клиента шаг за шагом. Логика ветвления показывает только то, что относится к его выбору.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    n: "03",
    title: "Результат",
    text: "Подбирает товар или считает стоимость по ответам. Скидка или бонус за прохождение подталкивают к заявке.",
    icon: (
      <>
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </>
    ),
  },
  {
    n: "04",
    title: "Заявка",
    text: "Контакты уходят в вашу CRM и мессенджеры, а каждый шаг воронки виден в аналитике.",
    icon: (
      <>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </>
    ),
  },
];

export function HowSection() {
  return (
    <div
      style={{ background: "linear-gradient(180deg,#E4EAF5,#DFE7F3)", padding: "112px 0" }}
      data-screen-label="Как работает квиз"
    >
      <Container>
        <SectionBadge number={4} label="Как работает квиз" />
        <h2
          style={{
            margin: "0 0 64px",
            fontSize: "clamp(1.5rem,4vw,3.2rem)",
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          Квиз ведёт клиента<br />как живой диалог.
        </h2>
        <Reveal
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(230px,100%),1fr))",
            gap: 24,
          }}
        >
          {steps.map((s) => (
            <div
              key={s.n}
              className="qv-lift"
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 28,
                boxShadow: "0 8px 28px rgba(13,32,68,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    background: "rgba(40,85,156,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#28559c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {s.icon}
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#b7c6de" }}>{s.n}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>
                {s.title}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#4b5563", textWrap: "pretty" }}>
                {s.text}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </div>
  );
}
