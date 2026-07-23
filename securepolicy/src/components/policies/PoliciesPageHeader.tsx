"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

export function PoliciesPageHeader() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("policiesPage.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("policiesPage.subtitle")}</p>
      </div>
      <Link href="/generate">
        <Button>
          <Plus size={16} />
          {t("policiesPage.generateNew")}
        </Button>
      </Link>
    </div>
  );
}
