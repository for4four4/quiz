import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/site/Container";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { Faq } from "@/components/pricing/Faq";
import { routes } from "@/lib/nav";
import { getSiteContent } from "@/lib/server/siteContent";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Тарифы",
  description:
    "Честные тарифы Квалифай: вся аналитика и свой код на любом тарифе, включая бесплатный. Неиспользованные заявки переносятся на следующий месяц.",
  alternates: { canonical: "/tarify" },
};

type Cell = { v: string; c: string };
const yes: Cell = { v: "✓", c: "#28559c" };
const no: Cell = { v: "—", c: "#d1d5db" };
const txt = (v: string): Cell => ({ v, c: "#111827" });

type Row =
  | { kind: "group"; name: string }
  | { kind: "row"; name: string; cells: [Cell, Cell, Cell] };

const cmp: Row[] = [
  { kind: "group", name: "Конструктор" },
  { kind: "row", name: "Заявок в месяц", cells: [txt("10"), txt("30"), txt("100–5000")] },
  { kind: "row", name: "Перенос неиспользованных заявок", cells: [no, yes, yes] },
  { kind: "row", name: "Безлимит квизов и проектов", cells: [yes, yes, yes] },
  { kind: "row", name: "ИИ-генерация квизов", cells: [yes, yes, yes] },
  { kind: "row", name: "Свободная обложка и свои поля", cells: [yes, yes, yes] },
  { kind: "row", name: "Логика ветвления и калькулятор", cells: [yes, yes, yes] },
  { kind: "group", name: "Аналитика" },
  { kind: "row", name: "Яндекс.Метрика на каждый шаг", cells: [yes, yes, yes] },
  { kind: "row", name: "Вставка своего кода", cells: [yes, yes, yes] },
  { kind: "row", name: "Коллтрекинг", cells: [no, yes, yes] },
  { kind: "group", name: "Интеграции и заявки" },
  { kind: "row", name: "Встроенная CRM (лиды и статусы)", cells: [yes, yes, yes] },
  { kind: "row", name: "amoCRM, Битрикс24, вебхуки", cells: [no, yes, yes] },
  { kind: "row", name: "Telegram, MAX, ВКонтакте", cells: [no, yes, yes] },
  { kind: "row", name: "Экспорт заявок в CSV", cells: [no, yes, yes] },
  { kind: "group", name: "Брендинг и команда" },
  { kind: "row", name: "Без бейджа Квалифай", cells: [no, yes, yes] },
  { kind: "row", name: "Свой домен", cells: [no, no, yes] },
  { kind: "row", name: "Загрузка видео", cells: [no, no, yes] },
  { kind: "row", name: "A/B-тесты и динамический контент", cells: [no, no, yes] },
  { kind: "row", name: "Приглашения в проект", cells: [no, no, yes] },
  { kind: "row", name: "Приоритетная поддержка", cells: [no, no, yes] },
];

const faq: [string, string][] = [
  [
    "Как протестировать сервис?",
    "Бесплатный тариф даёт 10 заявок каждый месяц без ограничения по времени. Редактор, ИИ-генерация и аналитика доступны полностью — карта не нужна.",
  ],
  [
    "Что такое заявка?",
    "Заявка — контакты пользователя, который заполнил квиз. Она списывается, только когда вы открываете контакты в личном кабинете.",
  ],
  [
    "Правда, что заявки не сгорают?",
    "Да. Неиспользованный остаток на платных тарифах переносится на следующий месяц, пока подписка активна. При переходе на Бесплатный накопленные заявки сохраняются.",
  ],
  [
    "Что будет, если заявок придёт больше лимита?",
    "Квиз продолжит работать, заявки будут копиться в кабинете. Открытие сверх лимита оплачивается поштучно по цене вашего пакета — или просто перейдите на пакет побольше.",
  ],
  [
    "Что будет с квизами, если перестану платить?",
    "Аккаунт перейдёт на Бесплатный тариф, квизы продолжат работать и собирать заявки. Настроенный функционал не удаляется.",
  ],
  [
    "Как оплатить и есть ли скидки?",
    "Любой картой или по счёту для юрлиц. Оплата на год вперёд — со скидкой 20%.",
  ],
];

export default async function TarifyPage() {
  const { pricing } = await getSiteContent();
  return (
    <div style={{ background: "#EFEFEF", color: "#111827", minHeight: "100vh" }}>
      <Nav variant="inner" active={routes.tarify} />

      {/* Header */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "72px clamp(20px,5vw,48px) 48px",
        }}
      >
        <h1
          style={{
            margin: "0 0 20px",
            fontSize: "clamp(2rem,4.5vw,3.6rem)",
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          Честные тарифы.<br />Заявки не сгорают.
        </h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "#4b5563", maxWidth: 560, textWrap: "pretty" }}>
          Вся аналитика и свой код — на любом тарифе, включая бесплатный. Неиспользованные заявки
          переносятся на следующий месяц.
        </p>
      </div>

      <PricingPlans pricing={pricing} />

      {/* Comparison */}
      <div style={{ background: "#ffffff", padding: "96px 0", marginTop: 64 }} data-screen-label="Сравнение тарифов">
        <Container>
          <h2 style={{ margin: "0 0 48px", fontSize: "clamp(1.4rem,3vw,2.4rem)", fontWeight: 500, letterSpacing: "-0.02em" }}>
            Полное содержание тарифов
          </h2>
          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px,1fr) 110px 110px 110px",
                fontSize: 14,
                minWidth: 600,
              }}
            >
              <HeadCell style={{ color: "#6b7280", fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>
                Функция
              </HeadCell>
              <HeadCell>Бесплатный</HeadCell>
              <HeadCell>Старт</HeadCell>
              <HeadCell style={{ color: "#28559c" }}>Про</HeadCell>

              {cmp.map((r) =>
                r.kind === "group" ? (
                  <div
                    key={r.name}
                    style={{
                      gridColumn: "1 / -1",
                      padding: "13px 0",
                      borderBottom: "1px solid #f3f4f6",
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    {r.name}
                  </div>
                ) : (
                  <RowCells key={r.name} name={r.name} cells={r.cells} />
                )
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* FAQ */}
      <div style={{ background: "#F5F5F5", padding: "96px 0" }} data-screen-label="FAQ">
        <Container>
          <h2 style={{ margin: "0 0 48px", fontSize: "clamp(1.4rem,3vw,2.4rem)", fontWeight: 500, letterSpacing: "-0.02em" }}>
            Вопросы по оплате
          </h2>
          <Faq items={faq} />
        </Container>
      </div>

      <Footer />
    </div>
  );
}

function HeadCell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: "1px solid #e5e7eb",
        fontWeight: 600,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function RowCells({ name, cells }: { name: string; cells: [Cell, Cell, Cell] }) {
  return (
    <>
      <div style={{ padding: "13px 0", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{name}</div>
      {cells.map((c, i) => (
        <div
          key={i}
          style={{ padding: "13px 0", borderBottom: "1px solid #f3f4f6", textAlign: "center", color: c.c }}
        >
          {c.v}
        </div>
      ))}
    </>
  );
}
