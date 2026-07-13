import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Не задана переменная окружения ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: required('JWT_SECRET'),
  databaseUrl: required('DATABASE_URL'),
  publicOrigin: process.env.PUBLIC_ORIGIN ?? 'http://localhost:8080',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads', // куда сохранять загруженные картинки
  polza: {
    apiKey: required('POLZA_API_KEY'),
    baseUrl: process.env.POLZA_BASE_URL ?? 'https://polza.ai/api/v1',
    modelFast: process.env.LLM_MODEL_FAST ?? 'anthropic/claude-haiku-4.5',
    modelSmart: process.env.LLM_MODEL_SMART ?? 'anthropic/claude-sonnet-4.6',
  },
};
