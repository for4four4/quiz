import { LogoMark } from "./Logo";
import { RollLink } from "./primitives";
import { footerDocs, footerPlatform } from "@/lib/nav";

const socials = [
  { src: "/uploads/telegram.svg", alt: "Telegram", radius: 0 },
  { src: "/uploads/vk.svg", alt: "VK", radius: 4 },
  { src: "/uploads/max.svg", alt: "MAX", radius: 0 },
];

export function Footer() {
  return (
    <div style={{ background: "#0F1F3C", color: "#ffffff" }} data-screen-label="Футер">
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "64px clamp(20px,5vw,48px) 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 48,
            flexWrap: "wrap",
            paddingBottom: 56,
          }}
        >
          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 300 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LogoMark size={36} />
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                <span style={{ color: "#8fb4ea" }}>Ква</span>лифай
              </div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
              Платформа квизов с ИИ-генерацией, аналитикой и CRM. Квизы, которые превращают
              посетителей в заявки.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {socials.map((s) => (
                <a
                  key={s.alt}
                  href="#"
                  aria-label={s.alt}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt={s.alt}
                    style={{ width: 18, height: 18, borderRadius: s.radius }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div style={{ display: "flex", gap: "clamp(40px,6vw,96px)", flexWrap: "wrap" }}>
            <FooterColumn title="Платформа">
              {footerPlatform.map((l) => (
                <RollLink
                  key={l.label}
                  href={l.href}
                  color="rgba(255,255,255,0.6)"
                  hoverColor="#ffffff"
                >
                  {l.label}
                </RollLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Документы">
              {footerDocs.map((l) => (
                <RollLink
                  key={l.label}
                  href={l.href}
                  color="rgba(255,255,255,0.6)"
                  hoverColor="#ffffff"
                >
                  {l.label}
                </RollLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Контакты">
              <RollLink href="mailto:hello@qvalify.ru" color="rgba(255,255,255,0.6)" hoverColor="#ffffff">
                hello@qvalify.ru
              </RollLink>
              <RollLink href="#" color="rgba(255,255,255,0.6)" hoverColor="#ffffff">
                Телеграм-поддержка
              </RollLink>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>Отвечаем ежедневно 9:00–21:00 мск</div>
            </FooterColumn>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "20px 0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12.5,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>© 2026 Квалифай · qvalify.ru</span>
          <span>Сделано с заботой о конверсии</span>
        </div>
      </div>
    </div>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5 }}>
      <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
