"use client";

import { useState } from "react";

export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 840 }}>
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "left",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "20px 24px",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              <span>{q}</span>
              <span style={{ color: "#28559c", fontSize: 18, flexShrink: 0 }}>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 24px 22px", fontSize: 14, lineHeight: 1.65, color: "#4b5563", maxWidth: 640 }}>
                {a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
