import type { Metadata } from "next";
import { CabinetApp } from "@/components/cabinet/CabinetApp";

export const metadata: Metadata = {
  title: "Кабинет",
  description: "Личный кабинет Квалифай: дашборд, квизы, заявки, интеграции и настройки.",
  robots: { index: false, follow: false },
};

export default function CabinetPage() {
  return <CabinetApp />;
}
