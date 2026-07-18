/** The "① Label" header chip that opens each numbered landing section. */
export function SectionBadge({
  number,
  label,
  variant = "light",
}: {
  number: number;
  label: string;
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: dark ? "#ffffff" : "#111827",
          color: dark ? "#0F1F3C" : "#ffffff",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          border: `1px solid ${dark ? "rgba(255,255,255,0.35)" : "#e5e7eb"}`,
          color: dark ? "#ffffff" : "#111827",
          borderRadius: 9999,
          padding: "6px 16px",
        }}
      >
        {label}
      </div>
    </div>
  );
}
