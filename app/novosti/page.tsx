import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { routes } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Новости",
  description:
    "Что нового в Квалифай: обновления платформы, новые интеграции и функции — коротко и по делу.",
  alternates: { canonical: "/novosti" },
};

const tags = {
  feature: { tag: "Функция", tagColor: "#28559c", tagBg: "rgba(40,85,156,0.08)" },
  integ: { tag: "Интеграция", tagColor: "#166534", tagBg: "rgba(22,101,52,0.08)" },
  platform: { tag: "Платформа", tagColor: "#111827", tagBg: "rgba(17,24,39,0.06)" },
} as const;

const news = [
  { date: "10 июля 2026", ...tags.feature, title: "ИИ-генерация квизов вышла из беты", text: "Опишите бизнес одной фразой — ИИ соберёт обложку, вопросы с ветвлением, калькулятор стоимости и форму контактов. Каждый сгенерированный блок редактируется как обычный." },
  { date: "2 июля 2026", ...tags.integ, title: "Интеграция с MAX", text: "Заявки из квизов теперь приходят в MAX: подключите бота в разделе «Интеграции» — уведомления о новых лидах будут падать в чат мгновенно." },
  { date: "24 июня 2026", ...tags.feature, title: "Перенос неиспользованных заявок", text: "Остаток лимита заявок больше не сгорает в конце месяца — он автоматически переносится на следующий. Правило работает на всех платных тарифах." },
  { date: "15 июня 2026", ...tags.platform, title: "Встроенная CRM в кабинете", text: "Лиды по каждому квизу, статусы, ответы и источники — теперь в личном кабинете. Внешнюю CRM можно подключить позже, ничего не потеряется." },
  { date: "3 июня 2026", ...tags.feature, title: "Свободный редактор обложки", text: "Первый экран квиза стал полностью свободным: двигайте заголовок, описание и преимущества, задавайте размеры, цвета, шрифты и бордеры без кода." },
];

export default function NovostiPage() {
  return (
    <div style={{ background: "#E8EDF6", color: "#111827", minHeight: "100vh" }}>
      <Nav variant="inner" active={routes.novosti} />

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto", boxSizing: "border-box", padding: "72px clamp(20px,5vw,48px) 48px" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.02em", marginBottom: 20, color: "#28559c", fontWeight: 600 }}>Новости</div>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem,3.4vw,3.4rem)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
          Что нового в Квалифай
        </h1>
        <p style={{ margin: "16px 0 0", fontSize: 16, color: "#4b5563", maxWidth: 560, lineHeight: 1.6 }}>
          Обновления платформы, новые интеграции и функции — коротко и по делу.
        </p>
      </div>

      {/* Featured */}
      <div style={{ maxWidth: 1100, margin: "0 auto", boxSizing: "border-box", padding: "0 clamp(20px,5vw,48px) 24px" }}>
        <div
          className="qv-news"
          style={{
            background: "linear-gradient(135deg,#0F1F3C,#28559c)",
            borderRadius: 20,
            padding: "clamp(28px,4vw,48px)",
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", width: "30vw", height: "30vw", right: "-8vw", top: "-12vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.15),rgba(255,255,255,0) 65%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, background: "#ffffff", color: "#28559c", borderRadius: 9999, padding: "4px 12px" }}>Главное</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>15 июля 2026</span>
          </div>
          <div style={{ fontSize: "clamp(1.4rem,2.6vw,2rem)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, maxWidth: 640 }}>
            Запускаем Квалифай: открыт приём первых клиентов
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.75)", maxWidth: 640 }}>
            Платформа вышла из закрытого тестирования. Первый квиз — бесплатно на любом тарифе: соберите его руками или доверьте ИИ,
            встройте на сайт и получите первые заявки. Подключаем клиентов в порядке очереди — регистрация уже открыта.
          </p>
          <Link
            href={routes.editor}
            className="qv-grp"
            style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#ffffff", color: "#28559c", fontSize: 14, fontWeight: 500, borderRadius: 9999, padding: "8px 8px 8px 24px", marginTop: 28, position: "relative" }}
          >
            <span className="qv-roll" style={{ height: 20 }}>
              <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
                <span>Создать первый квиз</span>
                <span>Создать первый квиз</span>
              </span>
            </span>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#28559c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg className="qv-arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      {/* List */}
      <div style={{ maxWidth: 1100, margin: "0 auto", boxSizing: "border-box", padding: "16px clamp(20px,5vw,48px) 96px", display: "flex", flexDirection: "column", gap: 16 }}>
        {news.map((n) => (
          <div
            key={n.title}
            className="qv-news"
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "28px clamp(22px,3vw,36px)",
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: 24,
              alignItems: "start",
              boxShadow: "0 6px 20px rgba(13,32,68,0.06)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap" }}>{n.date}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: n.tagColor, background: n.tagBg, borderRadius: 9999, padding: "4px 11px", display: "inline-block", marginTop: 10, whiteSpace: "nowrap" }}>
                {n.tag}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{n.title}</div>
              <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.65, color: "#4b5563", textWrap: "pretty" }}>{n.text}</p>
            </div>
          </div>
        ))}

        {/* Telegram subscribe */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            background: "#ffffff",
            borderRadius: 20,
            padding: "28px clamp(22px,3vw,36px)",
            marginTop: 24,
            boxShadow: "0 6px 20px rgba(13,32,68,0.06)",
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>Следите за обновлениями в Телеграме</div>
            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>Анонсы функций и советы по конверсии — без спама.</div>
          </div>
          <a href="#" className="qv-grp" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#28559c", color: "#ffffff", fontSize: 13.5, fontWeight: 500, borderRadius: 9999, padding: "10px 22px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uploads/telegram.svg" alt="" style={{ width: 17, height: 17, filter: "brightness(0) invert(1)" }} />
            <span className="qv-roll" style={{ height: 20 }}>
              <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
                <span>Подписаться</span>
                <span>Подписаться</span>
              </span>
            </span>
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
