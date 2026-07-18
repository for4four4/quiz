import { Container } from "../site/Container";
import { ArrowButton, RollLink } from "../site/primitives";
import { routes } from "@/lib/nav";

export function CtaSection() {
  return (
    <div id="cta" style={{ background: "#E8EDF6", padding: "112px 0 96px" }} data-screen-label="CTA">
      <Container>
        <div
          style={{
            background: "#28559c",
            borderRadius: 20,
            padding: "clamp(36px,6vw,72px) clamp(24px,5vw,64px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "40vw",
              height: "40vw",
              right: "-12vw",
              top: "-18vw",
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(255,255,255,0.14),rgba(255,255,255,0) 65%)",
              pointerEvents: "none",
            }}
          />
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(1.75rem,4vw,3.4rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            Первый квиз — бесплатно.
          </h2>
          <p
            style={{
              margin: "0 0 40px",
              fontSize: 16,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            Соберите квиз сами или доверьте ИИ, встройте на сайт и получите первые заявки — без карты.
            Дальше — честные тарифы: неиспользованные заявки не сгорают.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <ArrowButton
              href={routes.editor}
              bg="#ffffff"
              color="#28559c"
              circleBg="#28559c"
              arrowStroke="#ffffff"
            >
              Создать квиз бесплатно
            </ArrowButton>
            <RollLink
              href={routes.tarify}
              color="#ffffff"
              hoverColor="#ffffff"
              underlineHover
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              Смотреть тарифы
            </RollLink>
          </div>
        </div>
      </Container>
    </div>
  );
}
