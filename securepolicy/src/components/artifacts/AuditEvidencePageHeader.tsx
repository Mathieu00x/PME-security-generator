"use client";
import { useLanguage } from "@/contexts/LanguageContext";

export function AuditEvidencePageHeader({ companyName }: { companyName: string }) {
  const { t } = useLanguage();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t("audit.pageTitle")}</h1>
      <p className="text-gray-500 text-sm mt-1">{t("audit.pageSubtitle", { companyName })}</p>
    </div>
  );
}
