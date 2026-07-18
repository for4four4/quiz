import Link from "next/link";
import { Logo } from "./Logo";
import { RollLink } from "./primitives";
import { MoscowClock } from "../util/MoscowClock";
import { navLinks, routes } from "@/lib/nav";

/**
 * Floating white pill navigation.
 *
 * - `variant="hero"` (default): full bar with promo line + Moscow clock, used
 *   on the landing hero over the animated background.
 * - `variant="inner"`: compact bar for the marketing sub-pages; the active
 *   link renders as static accent text instead of a roll link.
 */
export function Nav({
  variant = "hero",
  active,
  clock = true,
  promo = "Подключаем клиентов в июле 2026",
}: {
  variant?: "hero" | "inner";
  active?: string;
  clock?: boolean;
  promo?: string;
}) {
  const inner = variant === "inner";
  const showClock = !inner || clock;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 20,
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        padding: 12,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 9999,
          padding: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, paddingLeft: 4 }}>
          <Logo />
          <div
            className="qv-nav-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {navLinks.map((l) =>
              active === l.href ? (
                <span key={l.href} style={{ fontWeight: 600, color: "#28559c" }}>
                  {l.label}
                </span>
              ) : (
                <RollLink key={l.href} href={l.href} style={{ height: 20 }}>
                  {l.label}
                </RollLink>
              )
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
          {!inner && (
            <div
              className="qv-promo"
              style={{
                fontSize: 13,
                color: "#4b5563",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {promo}
            </div>
          )}
          {showClock && (
            <div
              className="qv-hide-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#4b5563",
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <MoscowClock />
            </div>
          )}
          <Link
            href={routes.editor}
            className="qv-grp"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#111827",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 9999,
              padding: "8px 8px 8px 20px",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span className="qv-roll" style={{ height: 20 }}>
              <span className="qv-roll-col" style={{ lineHeight: "20px" }}>
                <span>Создать квиз</span>
                <span>Создать квиз</span>
              </span>
            </span>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                className="qv-arr"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
