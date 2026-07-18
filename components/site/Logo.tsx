import Link from "next/link";

/** Квалифай logo mark — the rounded checklist glyph used across the site. */
export function LogoMark({
  size = 40,
  bg = "#28559c",
}: {
  size?: number;
  bg?: string;
}) {
  const inner = Math.round(size * 0.5);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.55" />
        <rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="#fff" opacity="0.8" />
        <rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="#fff" />
        <path
          d="M13.5 15.4l1.6 1.6 3-3.4"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function Logo({
  size = 40,
  wordColor = "#111827",
  accent = "#28559c",
  bg = "#28559c",
}: {
  size?: number;
  wordColor?: string;
  accent?: string;
  bg?: string;
}) {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} bg={bg} />
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: wordColor,
        }}
      >
        <span style={{ color: accent }}>Ква</span>лифай
      </div>
    </Link>
  );
}
