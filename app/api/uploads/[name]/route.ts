import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
};

// GET /api/uploads/[name] — отдаёт загруженный файл из UPLOAD_DIR
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = basename(name); // защита от path traversal
  try {
    const buf = await readFile(join(env.uploadDir, safe));
    const ext = extname(safe).toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": TYPES[ext] || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
        "access-control-allow-origin": "*",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
