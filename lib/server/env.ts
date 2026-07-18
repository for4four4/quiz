/**
 * Server-side configuration. Values come from environment variables
 * (`.env`, kept out of the repo). See `.env.example` for the full list.
 * Import only from server code (route handlers, server actions).
 */
export const env = {
  jwtSecret: process.env.JWT_SECRET || "",
  publicOrigin: process.env.PUBLIC_ORIGIN || "https://qvalify.ru",
  uploadDir: process.env.UPLOAD_DIR || "/var/www/quiz/uploads",
  databaseUrl: process.env.DATABASE_URL || "",

  polza: {
    apiKey: process.env.POLZA_API_KEY || "",
    baseUrl: process.env.POLZA_BASE_URL || "https://polza.ai/api/v1",
    modelFast: process.env.LLM_MODEL_FAST || "anthropic/claude-haiku-4.5",
    modelSmart: process.env.LLM_MODEL_SMART || "anthropic/claude-sonnet-4.6",
  },

  telegram: { botToken: process.env.TELEGRAM_BOT_TOKEN || "" },
  vk: { token: process.env.VK_TOKEN || "" },
  max: { botToken: process.env.MAX_BOT_TOKEN || "" },
};

export function assertConfigured(name: string, value: string): string {
  if (!value) throw new Error(`Не задана переменная окружения: ${name}`);
  return value;
}
