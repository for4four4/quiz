"use client";

import { useEffect, useState } from "react";
import { api, type Integration } from "@/lib/client/api";
import type { QuizIntegrations } from "@/lib/quiz/doc";
import { Field, inp, Section, Toggle } from "./controls";

// Серверные каналы доставки заявок и поля, которые можно переопределить для квиза
const CHANNELS: { kind: string; name: string; fields: { id: string; label: string; ph: string }[] }[] = [
  { kind: "telegram", name: "Telegram", fields: [{ id: "code", label: "Код подключения / chat id", ph: "как в общих настройках" }] },
  { kind: "max", name: "MAX", fields: [{ id: "code", label: "Код подключения / chat id", ph: "как в общих настройках" }] },
  { kind: "vk", name: "ВКонтакте", fields: [{ id: "gid", label: "ID сообщества", ph: "как в общих настройках" }] },
  { kind: "webhook", name: "Вебхук", fields: [{ id: "url", label: "URL для POST", ph: "как в общих настройках" }, { id: "secret", label: "Секрет подписи", ph: "как в общих настройках" }] },
  { kind: "bitrix24", name: "Битрикс24", fields: [{ id: "url", label: "URL входящего вебхука", ph: "как в общих настройках" }] },
  { kind: "amocrm", name: "amoCRM", fields: [{ id: "domain", label: "Домен", ph: "как в общих настройках" }, { id: "token", label: "Токен доступа", ph: "как в общих настройках" }] },
];

export function LeadsRoutingEditor({ rules, onChange }: {
  rules: QuizIntegrations;
  onChange: (kind: string, patch: { enabled?: boolean; config?: Record<string, string> }) => void;
}) {
  const [connected, setConnected] = useState<Record<string, Integration> | null>(null);
  useEffect(() => {
    api.integrations()
      .then(({ integrations }) => setConnected(Object.fromEntries(integrations.filter((i) => i.enabled).map((i) => [i.kind, i]))))
      .catch(() => setConnected({}));
  }, []);

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center", padding: "28px 24px" }}>
      <div style={{ width: 620, maxWidth: "100%" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Куда отправлять заявки этого квиза</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4, marginBottom: 18, lineHeight: 1.55 }}>
          По умолчанию заявка уходит во <b>все каналы</b>, подключённые в кабинете (раздел «Интеграции»).
          Здесь можно отключить канал для этого квиза или задать свои ключи — они перекроют общие только для него.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CHANNELS.map((ch) => {
            const rule = rules[ch.kind] || {};
            const enabled = rule.enabled !== false;
            const isConnected = !!connected?.[ch.kind];
            const hasOverride = !!rule.config && Object.values(rule.config).some((v) => v && v.trim());
            return (
              <div key={ch.kind} style={{ background: "#fff", borderRadius: 16, padding: "14px 18px", opacity: connected === null ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ch.name}</div>
                    <div style={{ fontSize: 11.5, color: isConnected ? "#166534" : "#9ca3af", marginTop: 2 }}>
                      {isConnected ? (hasOverride ? "Подключено · свои ключи для этого квиза" : "Подключено · общие настройки") : "Не подключено в кабинете — канал не сработает"}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: enabled ? "#374151" : "#9ca3af" }}>{enabled ? "Вкл" : "Выкл"}</span>
                  <Toggle on={enabled} onClick={() => onChange(ch.kind, { enabled: !enabled })} />
                </div>
                {enabled && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                    {ch.fields.map((f) => (
                      <Field key={f.id} label={f.label}>
                        <input
                          value={rule.config?.[f.id] || ""}
                          placeholder={f.ph}
                          onChange={(e) => onChange(ch.kind, { config: { ...(rule.config || {}), [f.id]: e.target.value } })}
                          style={{ ...inp, fontFamily: "monospace", fontSize: 12 }}
                        />
                      </Field>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Section title="Как это работает">
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
            Пустые поля — используются общие ключи из кабинета. Заполненные — действуют только для этого квиза
            (удобно, когда заявки с разных квизов должны попадать в разные чаты или воронки).
            Не забудьте нажать «Сохранить» вверху.
          </div>
        </Section>
      </div>
    </div>
  );
}
