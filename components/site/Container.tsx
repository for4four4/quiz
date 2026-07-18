import type { CSSProperties, ReactNode } from "react";

/** Centered 1440px content column with the standard horizontal gutter. */
export function Container({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        maxWidth: 1440,
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "0 clamp(20px,5vw,48px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
