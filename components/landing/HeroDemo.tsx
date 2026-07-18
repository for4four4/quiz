/**
 * The auto-playing "quiz on your site" preview shown on the right of the hero.
 * Pure CSS animation — no client JS required.
 */
export function HeroDemo() {
  return (
    <div className="qv-hero-demo" style={{ minWidth: 0 }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 30px 90px rgba(13,32,68,0.35)",
          overflow: "hidden",
          position: "relative",
          height: 440,
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "13px 18px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Dot />
          <Dot />
          <Dot />
          <span style={{ fontSize: 11, color: "#c4c8cf", marginLeft: 8 }}>ваш-сайт.ру</span>
        </div>

        {/* Faux site content */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 11 }}>
          <SkeletonLine w="55%" />
          <SkeletonLine w="80%" />
          <SkeletonLine w="65%" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
            <div style={{ height: 88, background: "#f7f7f7", borderRadius: 12 }} />
            <div style={{ height: 88, background: "#f7f7f7", borderRadius: 12 }} />
          </div>
          <SkeletonLine w="70%" />
          <SkeletonLine w="48%" />
        </div>

        {/* Floating "Пройти квиз" button */}
        <div
          style={{
            position: "absolute",
            right: 18,
            bottom: 18,
            background: "#28559c",
            color: "#ffffff",
            borderRadius: 9999,
            padding: "12px 20px",
            fontSize: 12.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 24px rgba(40,85,156,0.45)",
            animation: "qvDemoBtn 9s ease-in-out infinite",
          }}
        >
          <MiniGlyph />
          Пройти квиз
        </div>

        {/* Cursor */}
        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 30,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(17,24,39,0.9)",
            border: "2px solid #ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            zIndex: 5,
            opacity: 0,
            animation: "qvDemoCur 9s ease-in-out infinite",
          }}
        />

        {/* Dim overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13,27,52,0.55)",
            opacity: 0,
            animation: "qvDemoDim 9s ease-in-out infinite",
          }}
        />

        {/* Quiz modal card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            animation: "qvDemoCard 9s ease-in-out infinite",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: 290,
              height: 238,
              boxShadow: "0 24px 64px rgba(13,27,52,0.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* progress */}
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 22,
                right: 22,
                height: 5,
                background: "#eceef2",
                borderRadius: 9999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#28559c",
                  borderRadius: 9999,
                  width: "12%",
                  animation: "qvDemoProg 9s ease-in-out infinite",
                }}
              />
            </div>

            {/* Step 1 */}
            <div
              style={{
                position: "absolute",
                top: 40,
                left: 22,
                right: 22,
                bottom: 18,
                animation: "qvDemoS1 9s ease-in-out infinite",
              }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>
                Какая кухня вам нужна?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                <DemoOption>Прямая</DemoOption>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "11px 13px",
                    fontSize: 12,
                    animation: "qvDemoOpt 9s ease-in-out infinite",
                  }}
                >
                  Угловая
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                position: "absolute",
                top: 40,
                left: 22,
                right: 22,
                bottom: 18,
                opacity: 0,
                animation: "qvDemoS2 9s ease-in-out infinite",
              }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>
                Ваш бюджет?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                <DemoOption>До 300 тыс.</DemoOption>
                <div
                  style={{
                    border: "1px solid #28559c",
                    background: "rgba(40,85,156,0.06)",
                    borderRadius: 10,
                    padding: "11px 13px",
                    fontSize: 12,
                  }}
                >
                  400–600 тыс.
                </div>
              </div>
            </div>

            {/* Step 3 — success */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textAlign: "center",
                padding: "0 24px",
                opacity: 0,
                animation: "qvDemoS3 9s ease-in-out infinite",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "rgba(22,101,52,0.1)",
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
                  stroke="#166534"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Заявка отправлена!</div>
              <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>
                Смета и скидка 10% уже летят в CRM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e5e7eb" }} />;
}

function SkeletonLine({ w }: { w: string }) {
  return <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5, width: w }} />;
}

function DemoOption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px 13px", fontSize: 12 }}>
      {children}
    </div>
  );
}

function MiniGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="#ffffff" opacity="0.55" />
      <rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="#ffffff" opacity="0.8" />
      <rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="#ffffff" />
    </svg>
  );
}
