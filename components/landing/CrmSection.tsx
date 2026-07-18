import { Container } from "../site/Container";
import { SectionBadge } from "./SectionBadge";

const status = {
  new: { bg: "rgba(40,85,156,0.10)", color: "#28559c", status: "Новая" },
  work: { bg: "rgba(17,24,39,0.07)", color: "#111827", status: "В работе" },
  done: { bg: "rgba(22,101,52,0.10)", color: "#166534", status: "Успешная" },
} as const;

const leads = [
  { name: "Анна Соколова", phone: "+7 921 344-18-02", source: "Плавающая кнопка", ...status.new },
  { name: "Дмитрий Ефимов", phone: "+7 903 512-77-40", source: "Встроенный блок", ...status.work },
  { name: "Мария Литвинова", phone: "+7 916 208-95-13", source: "Встроенный блок", ...status.done },
  { name: "Игорь Балашов", phone: "+7 928 655-30-91", source: "Плавающая кнопка", ...status.new },
];

export function CrmSection() {
  return (
    <div style={{ background: "#28559c", padding: "112px 0" }} data-screen-label="CRM">
      <Container>
        <SectionBadge number={6} label="Встроенная CRM" variant="dark" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(400px,100%),1fr))",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 24px",
                fontSize: "clamp(1.5rem,4vw,3.2rem)",
                fontWeight: 500,
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              Все заявки и статусы — прямо в Квалифай.
            </h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", textWrap: "pretty" }}>
              Не обязательно подключать внешнюю CRM: лиды по каждому квизу, статусы, ответы и источники
              видны в личном кабинете. Подключите интеграции, когда будете готовы.
            </p>
          </div>

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
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                padding: "18px 24px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>Заявки · Подбор кухни</div>
              <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>за 7 дней · 34 заявки</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 560 }}>
                {leads.map((l) => (
                  <div
                    key={l.phone}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr 1.1fr 96px",
                      gap: 16,
                      alignItems: "center",
                      padding: "14px 24px",
                      borderBottom: "1px solid #f7f7f7",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{l.name}</div>
                    <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{l.phone}</div>
                    <div style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{l.source}</div>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 9999,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        background: l.bg,
                        color: l.color,
                      }}
                    >
                      {l.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
