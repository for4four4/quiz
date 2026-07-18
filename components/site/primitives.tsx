import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/** A nav-style link whose label rolls up to an accent-coloured copy on hover. */
export function RollLink({
  href,
  children,
  color = "#111827",
  hoverColor = "#28559c",
  style,
  underlineHover = false,
}: {
  href: string;
  children: ReactNode;
  color?: string;
  hoverColor?: string;
  style?: CSSProperties;
  underlineHover?: boolean;
}) {
  return (
    <Link href={href} className="qv-roll" style={{ height: 20, color, ...style }}>
      <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
        <span>{children}</span>
        <span
          style={{
            color: hoverColor,
            textDecoration: underlineHover ? "underline" : undefined,
          }}
        >
          {children}
        </span>
      </span>
    </Link>
  );
}

/** Right-arrow that rotates -45° when its `.qv-grp` ancestor is hovered. */
export function ArrowIcon({
  size = 14,
  stroke = "#28559c",
}: {
  size?: number;
  stroke?: string;
}) {
  return (
    <svg
      className="qv-arr"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/** Primary pill CTA with a rolling label and circular arrow. */
export function ArrowButton({
  href,
  children,
  bg = "#28559c",
  color = "#ffffff",
  circleBg = "#ffffff",
  arrowStroke = "#28559c",
  style,
}: {
  href: string;
  children: ReactNode;
  bg?: string;
  color?: string;
  circleBg?: string;
  arrowStroke?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={href}
      className="qv-grp"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        background: bg,
        color,
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 9999,
        padding: "8px 8px 8px 24px",
        transition: "background .3s",
        ...style,
      }}
    >
      <span className="qv-roll" style={{ height: 20 }}>
        <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
          <span>{children}</span>
          <span>{children}</span>
        </span>
      </span>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: circleBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ArrowIcon stroke={arrowStroke} />
      </span>
    </Link>
  );
}
