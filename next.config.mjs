/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Собирает минимальный self-contained сервер в .next/standalone —
  // именно его копирует Docker-образ (см. Dockerfile).
  output: "standalone",
  // Базовые security-заголовки (аудит M3). CSP/X-Frame-Options НЕ ставим
  // глобально: раннер квиза и виджет должны встраиваться в чужие сайты.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
