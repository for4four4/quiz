import { basename, extname } from "node:path";
import { getUpload } from "@/lib/server/storage";

export const runtime = "nodejs";

// Только растровые изображения. SVG намеренно не в списке — отдаётся как
// вложение с nosniff, чтобы браузер не исполнил встроенный скрипт (аудит H1).
const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif",
};

// GET /api/uploads/[name] — отдаёт загруженный файл из UPLOAD_DIR
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = basename(name); // защита от path traversal
  const buf = await getUpload(safe);
  if (!buf) return new Response("Not found", { status: 404 });
  const ext = extname(safe).toLowerCase();
  const type = TYPES[ext];
  const headers: Record<string, string> = {
    "content-type": type || "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "access-control-allow-origin": "*",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
  };
  // Неизвестные/опасные типы (напр. легаси .svg) — только скачивание, без рендера
  if (!type) headers["content-disposition"] = `attachment; filename="${safe}"`;
  return new Response(new Uint8Array(buf), { headers });
}
