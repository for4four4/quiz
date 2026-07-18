import Link from "next/link";
import { ArrowIcon } from "./primitives";

/** Blue rounded call-to-action banner used at the bottom of several pages. */
export function CtaBanner({
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  style,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#28559c",
        borderRadius: 20,
        padding: "clamp(32px,5vw,56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "36vw",
          height: "36vw",
          right: "-10vw",
          top: "-16vw",
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(255,255,255,0.14),rgba(255,255,255,0) 65%)",
          pointerEvents: "none",
        }}
      />
      <div>
        <div style={{ fontSize: "clamp(1.4rem,2.6vw,2.2rem)", fontWeight: 500, letterSpacing: "-0.02em", color: "#ffffff" }}>
          {title}
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>{subtitle}</div>
      </div>
      <Link
        href={buttonHref}
        className="qv-grp"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          background: "#ffffff",
          color: "#28559c",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: 9999,
          padding: "8px 8px 8px 24px",
          position: "relative",
        }}
      >
        <span className="qv-roll" style={{ height: 20 }}>
          <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
            <span>{buttonLabel}</span>
            <span>{buttonLabel}</span>
          </span>
        </span>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#28559c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowIcon stroke="#ffffff" />
        </span>
      </Link>
    </div>
  );
}
