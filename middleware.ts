import { NextResponse, type NextRequest } from "next/server";

// Основной хост платформы (без него все запросы считались бы «своим доменом»).
// Берём из PUBLIC_ORIGIN, плюс локальная разработка.
function primaryHost(): string {
  try {
    return new URL(process.env.PUBLIC_ORIGIN || "https://qvalify.ru").hostname.replace(/^www\./, "");
  } catch {
    return "qvalify.ru";
  }
}

function isPrimary(host: string): boolean {
  const h = host.toLowerCase().split(":")[0].replace(/^www\./, "");
  if (!h) return true;
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) return true;
  if (h.endsWith(".vercel.app")) return true;
  const base = primaryHost();
  return h === base || h.endsWith("." + base);
}

// Свои домены клиентов: запрос корня переписываем на страницу рендера квиза по домену.
// Всё остальное (/_next, /api, /embed.js, статика) проходит как есть.
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  if (isPrimary(host)) return NextResponse.next();
  const clean = host.toLowerCase().split(":")[0].replace(/^www\./, "");
  const url = req.nextUrl.clone();
  url.pathname = `/d/${encodeURIComponent(clean)}`;
  return NextResponse.rewrite(url);
}

// Только корень своего домена — иначе ассеты и API остаются доступными.
export const config = {
  matcher: ["/"],
};
