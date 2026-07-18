import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { CtaBanner } from "@/components/site/CtaBanner";
import { routes } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Отзывы",
  description:
    "Первые клиенты о Квалифай: как квизы с аналитикой и встроенной CRM повышают конверсию сайта и снижают стоимость заявки.",
  alternates: { canonical: "/otzyvy" },
};

const BLUE = "#28559c";
const GRAY = "#d1d5db";

const stats = [
  { v: "4,9", l: "средняя оценка" },
  { v: "37", l: "компаний на платформе" },
  { v: "2 400+", l: "заявок за первый месяц" },
];

const reviews = [
  { star5: BLUE, initials: "ГК", avBg: "#28559c", name: "Герман", role: "Студия кухонь, Санкт-Петербург", text: "Перешли с другого конструктора из-за аналитики: там она была только на дорогом тарифе, здесь — сразу. Видим каждый шаг воронки в Метрике и наконец поняли, где теряли людей.", metric: "Конверсия сайта выросла с 1,8% до 6,4%" },
  { star5: BLUE, initials: "АМ", avBg: "#0F1F3C", name: "Алина", role: "Ремонт квартир, Москва", text: "ИИ собрал черновик квиза за минуту — я только поменяла пару формулировок и цвета под фирменный стиль. Раньше на такое уходил вечер с дизайнером.", metric: "Квиз запущен за 20 минут вместо двух дней" },
  { star5: GRAY, initials: "СВ", avBg: "#4084f4", name: "Сергей", role: "Стоматология, Казань", text: "Понравилось, что заявки не сгорают: в мае недобрали лимит, и остаток переехал на июнь. Честная схема. Хотелось бы больше готовых шаблонов под медицину — но говорят, скоро будут.", metric: "18 неиспользованных заявок перенесено" },
  { star5: BLUE, initials: "ОП", avBg: "#1e437d", name: "Ольга", role: "Автошкола, Екатеринбург", text: "Встроили квиз по CSS-селектору прямо в лендинг — выглядит как родная часть сайта, а не чужой виджет. Плюс уведомления о заявках падают в Телеграм мгновенно.", metric: "112 заявок за первый месяц" },
  { star5: BLUE, initials: "ДН", avBg: "#28559c", name: "Дмитрий", role: "Фитнес-клуб, Новосибирск", text: "CRM внутри кабинета закрыла вопрос на старте: статусы, источники, ответы — всё в одном месте. amoCRM подключили позже, когда выросли, — переезд занял десять минут.", metric: "Стоимость заявки снизилась в 2,3 раза" },
  { star5: GRAY, initials: "ЕК", avBg: "#0F1F3C", name: "Елена", role: "Юридическая фирма, Москва", text: "Редактор гибче, чем ожидала: двигаешь блоки, задаёшь бордеры и шрифты — квиз собрали строго под брендбук. Поддержка отвечает быстро, даже вечером в воскресенье.", metric: "Каждая пятая заявка — с квиза" },
];

function Star({ fill }: { fill: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function OtzyvyPage() {
  return (
    <div style={{ background: "#E8EDF6", color: "#111827", minHeight: "100vh" }}>
      <Nav variant="inner" active={routes.otzyvy} />

      {/* Header */}
      <div style={{ maxWidth: 1440, margin: "0 auto", boxSizing: "border-box", padding: "72px clamp(20px,5vw,48px) 40px" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.02em", marginBottom: 20, color: "#28559c", fontWeight: 600 }}>Отзывы</div>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem,3.4vw,3.4rem)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
          Первые клиенты — о Квалифай
        </h1>
        <div style={{ display: "flex", gap: "clamp(24px,4vw,64px)", flexWrap: "wrap", marginTop: 40 }}>
          {stats.map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 600, letterSpacing: "-0.02em", color: "#28559c" }}>{s.v}</div>
              <div style={{ fontSize: 13.5, color: "#6b7280", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1440, margin: "0 auto", boxSizing: "border-box", padding: "16px clamp(20px,5vw,48px) 96px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(340px,100%),1fr))", gap: 24 }}>
          {reviews.map((r) => (
            <div
              key={r.name + r.role}
              className="qv-rev"
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                boxShadow: "0 6px 20px rgba(13,32,68,0.06)",
              }}
            >
              <div style={{ display: "flex", gap: 3 }}>
                <Star fill={BLUE} />
                <Star fill={BLUE} />
                <Star fill={BLUE} />
                <Star fill={BLUE} />
                <Star fill={r.star5} />
              </div>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "#374151", textWrap: "pretty", flex: 1 }}>{r.text}</p>
              <div style={{ background: "rgba(40,85,156,0.06)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#28559c", fontWeight: 600 }}>
                {r.metric}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: r.avBg, color: "#ffffff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {r.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: "#6b7280" }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <CtaBanner
          title="Станьте следующей историей."
          subtitle="Первый квиз — бесплатно, без карты. Заявки начнут приходить уже сегодня."
          buttonLabel="Создать квиз бесплатно"
          buttonHref={routes.editor}
          style={{ marginTop: 64 }}
        />
      </div>

      <Footer />
    </div>
  );
}
