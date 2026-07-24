import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { env } from "./env";

// Абстракция хранилища загруженных файлов. Сейчас — локальный диск (UPLOAD_DIR).
// Для масштабирования (несколько сервисов, общий доступ к файлам) заменить
// реализацию на S3/MinIO — править нужно ТОЛЬКО этот модуль; вызовы в роутах
// (/api/upload, /api/uploads/[name]) не меняются. Это ответ на «где хранить»:
// локальный диск ломает сплит, объектное хранилище — нет.

/** Сохранить файл, вернуть публичный путь для раздачи. */
export async function putUpload(name: string, data: Buffer): Promise<string> {
  await mkdir(env.uploadDir, { recursive: true });
  await writeFile(join(env.uploadDir, basename(name)), data);
  return `/api/uploads/${name}`;
}

/** Прочитать файл; null, если нет. */
export async function getUpload(name: string): Promise<Buffer | null> {
  try {
    return await readFile(join(env.uploadDir, basename(name)));
  } catch {
    return null;
  }
}
