import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { CtaBanner } from "@/components/site/CtaBanner";
import { ExamplesGrid } from "@/components/examples/ExamplesGrid";
import { routes } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Примеры квизов",
  description:
    "Живые квизы из разных ниш: кухни, ремонт, медицина, автошколы, фитнес, услуги. Откройте любой и соберите похожий в Квалифай.",
  alternates: { canonical: "/primery" },
};

export default function PrimeryPage() {
  return (
    <div style={{ background: "#E8EDF6", color: "#111827", minHeight: "100vh" }}>
      <Nav variant="inner" active={routes.primery} />

      {/* Header */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "72px clamp(20px,5vw,48px) 48px",
        }}
        data-screen-label="Примеры — заголовок"
      >
        <div style={{ fontSize: 14, letterSpacing: "0.02em", marginBottom: 20, color: "#28559c", fontWeight: 600 }}>
          Примеры квизов
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem,3.4vw,3.4rem)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            textWrap: "balance",
          }}
        >
          Живые квизы из разных ниш.<br />Откройте любой и соберите похожий.
        </h1>
      </div>

      {/* Grid + CTA */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 clamp(20px,5vw,48px) 96px",
        }}
        data-screen-label="Примеры — сетка"
      >
        {/* category chips are rendered inside ExamplesGrid; nudge them up under the header */}
        <div style={{ marginTop: -12 }}>
          <ExamplesGrid />
        </div>

        <CtaBanner
          title="Не нашли свою нишу?"
          subtitle="Опишите бизнес одной фразой — ИИ соберёт квиз под вас за минуту."
          buttonLabel="Сгенерировать квиз"
          buttonHref={routes.editor}
          style={{ marginTop: 64 }}
        />
      </div>

      <Footer />
    </div>
  );
}
