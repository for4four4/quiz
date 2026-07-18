import { createHmac } from "node:crypto";
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
          default: return Promise.resolve();
        }
      })
  );
}
