import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { routes } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Документы",
  description:
    "Правовая информация Квалифай: договор-оферта, политика конфиденциальности и согласие на обработку персональных данных.",
  alternates: { canonical: "/dokumenty" },
};

type Para = { b?: string; text: string };
type Doc = { id: string; num: string; title: string; paras: Para[] };

const docs: Doc[] = [
  {
    id: "oferta",
    num: "Документ 1",
    title: "Договор-оферта",
    paras: [
      { b: "1. Общие положения.", text: "Настоящий документ является публичной офертой сервиса «Квалифай» (qvalify.ru) и определяет условия использования платформы для создания квизов. Регистрация в сервисе означает полное и безоговорочное принятие условий настоящей оферты." },
      { b: "2. Предмет договора.", text: "Исполнитель предоставляет Заказчику доступ к программному обеспечению для создания, размещения и аналитики квизов, а также к встроенной CRM и интеграциям, в объёме, соответствующем выбранному тарифу." },
      { b: "3. Тарифы и оплата.", text: "Стоимость и состав тарифов публикуются на странице «Тарифы». Оплата производится авансом за расчётный период. Неиспользованный лимит заявок переносится на следующий оплаченный период." },
      { b: "4. Права и обязанности сторон.", text: "Заказчик обязуется не использовать сервис для распространения запрещённой законодательством РФ информации. Исполнитель обязуется обеспечивать доступность сервиса и сохранность данных Заказчика." },
      { b: "5. Ответственность.", text: "Исполнитель не несёт ответственности за содержание квизов, создаваемых Заказчиком, и за результаты их использования. Совокупная ответственность Исполнителя ограничена суммой, уплаченной Заказчиком за последний расчётный период." },
      { b: "6. Срок действия.", text: "Оферта действует с момента публикации и до её отзыва Исполнителем. Изменения вступают в силу с момента публикации новой редакции на сайте." },
    ],
  },
  {
    id: "policy",
    num: "Документ 2",
    title: "Политика конфиденциальности",
    paras: [
      { b: "1. Какие данные мы собираем.", text: "Данные учётной записи (имя, e-mail, телефон), платёжные данные, данные квизов и заявок, а также технические данные (IP-адрес, cookies, сведения об устройстве) — в объёме, необходимом для работы сервиса." },
      { b: "2. Цели обработки.", text: "Предоставление доступа к сервису, приём и передача заявок в CRM и мессенджеры Заказчика, аналитика, поддержка пользователей и информирование об обновлениях сервиса." },
      { b: "3. Хранение и защита.", text: "Данные хранятся на серверах на территории РФ в соответствии с 152-ФЗ «О персональных данных». Доступ к данным ограничен, передача осуществляется по защищённым каналам." },
      { b: "4. Передача третьим лицам.", text: "Данные передаются только сервисам, подключённым Заказчиком (CRM, мессенджеры, аналитика), и не передаются иным лицам, за исключением случаев, предусмотренных законом." },
      { b: "5. Права субъекта данных.", text: "Вы вправе запросить сведения об обработке, потребовать уточнения или удаления данных, а также отозвать согласие, направив запрос на hello@qvalify.ru." },
    ],
  },
  {
    id: "consent",
    num: "Документ 3",
    title: "Согласие на обработку персональных данных",
    paras: [
      { text: "Регистрируясь в сервисе «Квалифай» или отправляя данные через форму квиза, вы свободно, своей волей и в своём интересе даёте согласие на обработку ваших персональных данных оператором сервиса." },
      { b: "Состав данных:", text: "фамилия, имя, отчество; номер телефона; адрес электронной почты; иные данные, добровольно указанные в полях форм." },
      { b: "Действия с данными:", text: "сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача подключённым Заказчиком сервисам, блокирование и удаление." },
      { b: "Срок действия:", text: "согласие действует до момента его отзыва. Отозвать согласие можно в любой момент, направив письмо на hello@qvalify.ru — данные будут удалены в течение 30 дней." },
    ],
  },
];

const sideLinks = [
  { href: "#oferta", label: "Договор-оферта" },
  { href: "#policy", label: "Политика конфиденциальности" },
  { href: "#consent", label: "Согласие на обработку данных" },
];

export default function DokumentyPage() {
  return (
    <div style={{ background: "#E8EDF6", color: "#111827", minHeight: "100vh" }}>
      <Nav variant="inner" active={routes.dokumenty} clock={false} />

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto", boxSizing: "border-box", padding: "64px clamp(20px,5vw,48px) 40px" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.02em", marginBottom: 20, color: "#28559c", fontWeight: 600 }}>Правовая информация</div>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem,3.4vw,3.2rem)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          Документы Квалифай
        </h1>
        <p style={{ margin: "16px 0 0", fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
          Редакция от 1 июля 2026 года · ИП Иванов И. И. · ИНН 000000000000 · qvalify.ru
        </p>
      </div>

      {/* Grid: side nav + docs */}
      <div
        className="qv-doc-grid"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 clamp(20px,5vw,48px) 96px",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 32,
          alignItems: "start",
        }}
      >
        <div
          className="qv-doc-side"
          style={{
            position: "sticky",
            top: 24,
            background: "#ffffff",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 13.5,
            boxShadow: "0 6px 20px rgba(13,32,68,0.06)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 12px" }}>
            Содержание
          </div>
          {sideLinks.map((l) => (
            <a key={l.href} href={l.href} style={{ padding: "9px 12px", borderRadius: 10 }}>
              {l.label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          {docs.map((d) => (
            <div
              key={d.id}
              id={d.id}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "clamp(24px,4vw,44px)",
                boxShadow: "0 6px 20px rgba(13,32,68,0.06)",
                scrollMarginTop: 24,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#28559c", background: "rgba(40,85,156,0.08)", borderRadius: 9999, padding: "4px 12px", display: "inline-block", marginBottom: 16 }}>
                {d.num}
              </div>
              <h2 style={{ margin: "0 0 20px", fontSize: "clamp(1.3rem,2.2vw,1.8rem)", fontWeight: 600, letterSpacing: "-0.02em" }}>{d.title}</h2>
              <div style={{ fontSize: 14.5, lineHeight: 1.75, color: "#374151", display: "flex", flexDirection: "column", gap: 14 }}>
                {d.paras.map((p, i) => (
                  <p key={i} style={{ margin: 0 }}>
                    {p.b && <b style={{ fontWeight: 600, color: "#111827" }}>{p.b}</b>} {p.text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
