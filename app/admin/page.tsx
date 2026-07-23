import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { getSession, isAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Админ-панель",
  description: "Админ-панель Квалифай: клиенты, тарифы и поддержка.",
  robots: { index: false, follow: false },
};

// Гейт доступа (аудит M6): раньше /admin был открыт всем.
export default async function AdminPage() {
  const s = await getSession();
  if (!(await isAdmin(s))) redirect("/vhod");
  return <AdminApp />;
}
