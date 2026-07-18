import { Container } from "../site/Container";
import { Reveal } from "../util/Reveal";
import { SectionBadge } from "./SectionBadge";

const cards = [
  {
    n: "01",
    title: "Аналитика без доплат",
    text: "Яндекс.Метрика, коллтрекинг и свой код — на каждом шаге квиза, каждом клике и каждой кнопке. Доступно на всех тарифах, включая стартовый.",
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </>
    ),
  },
  {
    n: "02",
    title: "Заявки не сгорают",
    text: "Не израсходовали лимит за месяц — остаток переносится на следующий. Вы платите за заявки, а не за календарь.",
    icon: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </>
    ),
  },
  {
    n: "03",
    title: "Дизайн без шаблонных рамок",
    text: "Каждый экран квиза — редактируемые блоки: двигайте, меняйте размеры, цвета и шрифты. Квиз выглядит как часть вашего сайта, а не чужой виджет.",
    icon: (
      <>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </>
    ),
  },
];

export function WhySection() {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#E8EDF6,#DFE7F3)",
        padding: "128px 0 96px",
        overflow: "hidden",
      }}
      data-screen-label="Почему Квалифай"
    >
      <Container>
        <SectionBadge number={1} label="Почему Квалифай" />
        <h2
          style={{
            margin: "0 0 96px",
            fontSize: "clamp(1.5rem,4vw,3.2rem)",
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          Всё, за что обычно доплачивают, —<br />у нас включено с первого тарифа.
        </h2>
        <Reveal
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))",
            gap: 24,
          }}
        >
          {cards.map((c) => (
            <div
              key={c.n}
              className="qv-lift"
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 32,
                boxShadow: "0 8px 28px rgba(13,32,68,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 26,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "rgba(40,85,156,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#28559c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {c.icon}
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#b7c6de" }}>{c.n}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 12 }}>
                {c.title}
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "#4b5563", textWrap: "pretty" }}>
                {c.text}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </div>
  );
}
