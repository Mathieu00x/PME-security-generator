"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("error.title")}</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">{t("error.desc")}</p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => reset()}>
          <RotateCcw size={14} /> {t("error.retry")}
        </Button>
        <Link href="/">
          <Button>{t("error.cta")}</Button>
        </Link>
      </div>
    </div>
  );
}
