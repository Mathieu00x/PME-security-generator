"use client";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";

export function PolicyDetailInfoCard({ createdAt, version }: { createdAt: string; version: string | number }) {
  const { t, dateLocale } = useLanguage();
  const items = [
    { label: t("policyDetail.policyOwner"), value: t("policyDetail.itDepartment") },
    {
      label: t("policyDetail.reviewDate"),
      value: new Date(new Date(createdAt).setFullYear(new Date(createdAt).getFullYear() + 1)).toLocaleDateString(dateLocale),
    },
    { label: t("policyDetail.nextReview"), value: t("policyDetail.in12Months") },
    { label: t("policyDetail.version"), value: String(version) },
  ];

  return (
    <Card padding="sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("policyDetail.docInfo")}</h3>
      <dl className="flex flex-col gap-2.5">
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-gray-400">{label}</dt>
            <dd className="text-sm text-gray-700 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function PolicyDetailScoreCard({ score, riskLevel }: { score: number; riskLevel: string }) {
  const { t } = useLanguage();
  return (
    <Card padding="sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("dashboard.securityScore")}</h3>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444" }}
        >
          {score}
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("policyDetail.outOf100")}</p>
          <p className="text-sm font-medium text-gray-700">{riskLevel} Risk</p>
        </div>
      </div>
      <Link href="/security-score" className="text-xs text-blue-600 hover:underline">
        {t("policyDetail.viewFullReport")}
      </Link>
    </Card>
  );
}
