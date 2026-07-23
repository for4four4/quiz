import { createHmac } from "node:crypto";
import nodemailer from "nodemailer";
import { env } from "./env";

export type LeadPayload = {
  quizName: string;
  name: string;
  phone: string;
  email?: string;
  answers: { q: string; a: string }[];
  source: string;
  score: number;
  summary?: string;
};

type IntegrationRow = { kind: string; config: Record<string, string>; enabled: boolean };

function leadText(l: LeadPayload): string {
  const lines = [
    `🎯 Новая заявка · ${l.quizName}`,
    `${l.name || "Без имени"} · ${l.phone}`,
    l.email ? `✉ ${l.email}` : "",
    `Источник: ${l.source} · скоринг ${l.score}/100`,
    "",
    ...l.answers.map((a) => `• ${a.q}: ${a.a}`),
    l.summary ? `\n🤖 ${l.summary}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

async function sendTelegram(chatId: string, l: LeadPayload) {
  const token = env.telegram.botToken;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: leadText(l) }),
  });
}

async function sendVk(groupId: string, userId: string, l: LeadPayload) {
  const token = env.vk.token;
  if (!token) return;
  const params = new URLSearchParams({
    access_token: token,
    v: "5.199",
    peer_id: userId || groupId,
    random_id: String(Date.now()),
    message: leadText(l),
  });
  await fetch("https://api.vk.com/method/messages.send", { method: "POST", body: params });
}

async function sendMax(chatId: string, l: LeadPayload) {
  const token = env.max.botToken;
  if (!token) return;
  await fetch(`https://botapi.max.ru/messages?chat_id=${encodeURIComponent(chatId)}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: leadText(l) }),
  });
}

async function sendWebhook(url: string, secret: string | undefined, l: LeadPayload) {
  const body = JSON.stringify(l);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) headers["X-Qvalify-Signature"] = createHmac("sha256", secret).update(body).digest("hex");
  await fetch(url, { method: "POST", headers, body });
}

// Результаты на почту владельца (SMTP из .env)
async function sendEmail(to: string, l: LeadPayload) {
  if (!to || !env.smtp.host) return;
  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  const rows = l.answers.map((a) => `<tr><td style="padding:6px 12px;color:#6b7280">${esc(a.q)}</td><td style="padding:6px 12px;font-weight:600">${esc(a.a)}</td></tr>`).join("");
  await transporter.sendMail({
    from: `Квалифай <${env.smtp.from}>`,
    to,
    subject: `Новая заявка · ${l.quizName} · ${l.phone}`,
    text: leadText(l),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="color:#0F1F3C">Новая заявка · ${esc(l.quizName)}</h2>
      <p><b>${esc(l.name || "Без имени")}</b> · ${esc(l.phone)}${l.email ? " · " + esc(l.email) : ""}</p>
      <p style="color:#6b7280">Источник: ${esc(l.source)} · скоринг <b>${l.score}/100</b></p>
      <table style="border-collapse:collapse;background:#f8f9fb;border-radius:8px">${rows}</table>
      ${l.summary ? `<p style="background:#eef2f9;border-radius:8px;padding:10px 14px">🤖 ${esc(l.summary)}</p>` : ""}
    </div>`,
  });
}
function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Битрикс24 — входящий вебхук: создаём лид (crm.lead.add).
async function sendBitrix24(webhookUrl: string, l: LeadPayload) {
  if (!webhookUrl) return;
  const base = webhookUrl.endsWith("/") ? webhookUrl : webhookUrl + "/";
  const fields: Record<string, unknown> = {
    TITLE: `Квалифай · ${l.quizName}`,
    NAME: l.name || "Заявка с квиза",
    PHONE: [{ VALUE: l.phone, VALUE_TYPE: "WORK" }],
    SOURCE_DESCRIPTION: l.source,
    COMMENTS: leadText(l),
    OPPORTUNITY: l.score,
  };
  if (l.email) fields.EMAIL = [{ VALUE: l.email, VALUE_TYPE: "WORK" }];
  await fetch(base + "crm.lead.add.json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: "Y" } }),
  });
}

// amoCRM — создаём сделку с контактом (нужен домен + долгоживущий токен доступа).
async function sendAmocrm(domain: string, token: string, l: LeadPayload) {
  if (!domain || !token) return;
  const host = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const body = [
    {
      name: `${l.quizName} · ${l.name || "заявка"}`,
      price: l.score,
      _embedded: {
        contacts: [
          {
            name: l.name || "Клиент с квиза",
            custom_fields_values: [
              { field_code: "PHONE", values: [{ value: l.phone, enum_code: "WORK" }] },
              ...(l.email ? [{ field_code: "EMAIL", values: [{ value: l.email, enum_code: "WORK" }] }] : []),
            ],
          },
        ],
      },
    },
  ];
  await fetch(`https://${host}/api/v4/leads/complex`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

/** Fan out a lead to all enabled integrations for a user. Best-effort. */
export async function dispatchLead(integrations: IntegrationRow[], lead: LeadPayload): Promise<void> {
  await Promise.allSettled(
    integrations
      .filter((i) => i.enabled)
      .map((i) => {
        const c = i.config || {};
        switch (i.kind) {
          case "telegram": return sendTelegram(c.chatId || c.code, lead);
          case "vk": return sendVk(c.gid, c.userId, lead);
          case "max": return sendMax(c.chatId || c.code, lead);
          case "webhook": return sendWebhook(c.url, c.secret, lead);
          case "bitrix24": return sendBitrix24(c.url, lead);
          case "amocrm": return sendAmocrm(c.domain, c.token, lead);
          case "email": return sendEmail(c.to, lead);
          default: return Promise.resolve();
        }
      })
  );
}
