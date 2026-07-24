import { NextResponse } from "next/server";
import { extname } from "node:path";
import { randomBytes } from "node:crypto";
import { requireSession } from "@/lib/server/auth";
import { putUpload } from "@/lib/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SVG исключён намеренно: может нести <script> → stored-XSS при открытии файла (аудит H1).
const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const MAX = 5 * 1024 * 1024; // 5 МБ

// POST /api/upload — загрузка картинки файлом (multipart form-data, поле "file")
export async function POST(req: Request) {
  try {
    await requireSession();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "Файл больше 5 МБ" }, { status: 400 });
    const ext = (extname(file.name || "") || ".png").toLowerCase();
    if (!ALLOWED.has(ext)) return NextResponse.json({ error: "Только изображения (png, jpg, webp, gif)" }, { status: 400 });

    const name = randomBytes(12).toString("hex") + ext;
    const url = await putUpload(name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
