"use client";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Compass size={28} className="text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("notFound.title")}</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">{t("notFound.desc")}</p>
      <Link href="/">
        <Button>{t("notFound.cta")}</Button>
      </Link>
    </div>
  );
}
