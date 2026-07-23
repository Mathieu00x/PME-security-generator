"use client";
import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AuditEvidenceReference } from "@/types";
import { ARTIFACT_DEFINITIONS } from "@/lib/artifacts";
import { useLanguage } from "@/contexts/LanguageContext";

export function AuditEvidenceCard({ evidence }: { evidence: AuditEvidenceReference[] }) {
  const { t } = useLanguage();
  return (
    <Card padding="sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
        <ClipboardCheck size={14} className="text-blue-500" />
        {t("audit.pageTitle")}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{t("sidebar.auditEvidence.desc")}</p>
      <ul className="flex flex-col gap-3">
        {evidence.map((e, i) => (
          <li key={i}>
            <p className="text-xs font-semibold text-gray-800">
              {ARTIFACT_DEFINITIONS[e.type] ? t(ARTIFACT_DEFINITIONS[e.type].titleKey) : e.type}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{e.reason}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/audit-evidence"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
      >
        {t("sidebar.auditEvidence.manage")} <ArrowRight size={11} />
      </Link>
    </Card>
  );
}
