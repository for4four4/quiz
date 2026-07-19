import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false },
};

export default function VhodPage() {
  return <AuthForm />;
}
