/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Собирает минимальный self-contained сервер в .next/standalone —
  // именно его копирует Docker-образ (см. Dockerfile).
  output: "standalone",
};

export default nextConfig;
