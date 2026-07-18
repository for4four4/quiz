import OpenAI from "openai";
import { assertConfigured, env } from "./env";

// Polza.ai is an OpenAI-compatible aggregator; we talk to it via the OpenAI SDK.
let client: OpenAI | null = null;
function llm(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: assertConfigured("POLZA_API_KEY", env.polza.apiKey),
      baseURL: env.polza.baseUrl,
    });
  }
  return client;
}

type ChatArgs = { system: string; user: string; smart?: boolean; json?: boolean };

/** Single-shot completion. `smart` picks the stronger model. */
export async function complete({ system, user, smart, json }: ChatArgs): Promise<string> {
  const res = await llm().chat.completions.create({
    model: smart ? env.polza.modelSmart : env.polza.modelFast,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    response_format: json ? { type: "json_object" } : undefined,
  });
  return res.choices[0]?.message?.content ?? "";
}
