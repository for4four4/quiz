import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Админ-панель",
  description: "Админ-панель Квалифай: клиенты, тарифы и поддержка.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
