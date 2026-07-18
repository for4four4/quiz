import type { Metadata } from "next";
import { EditorApp } from "@/components/editor/EditorApp";

export const metadata: Metadata = {
  title: "Редактор квиза",
  description: "Редактор квиза Квалифай: конструктор слайдов, настройка кнопки и показа.",
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return <EditorApp />;
}
