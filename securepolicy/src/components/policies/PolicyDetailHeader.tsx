"use client";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Policy } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

export function PolicyDetailHeader({ policy }: { policy: Policy }) {
  const { t, dateLocale } = useLanguage();
  return (
    <div className="flex items-center gap-4">
      <Link href="/policies">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{policy.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium capitalize">
            {policy.status}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">
          {t("dashboard.versionDate", {
            version: policy.version,
            date: new Date(policy.created_at).toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" }),
          })}
        </p>
      </div>
    </div>
  );
}

export function RegenerateButton({ policyId, canRegenerate }: { policyId: string; canRegenerate: boolean }) {
  const { t } = useLanguage();
  return canRegenerate ? (
    <Link href={`/generate?regenerate=${policyId}`}>
      <Button variant="outline" size="sm">
        <RefreshCw size={14} />
        {t("policyDetail.regenerate")}
      </Button>
    </Link>
  ) : (
    <Link href="/choose-plan">
      <Button variant="outline" size="sm">
        <RefreshCw size={14} />
        {t("policyDetail.regeneratePro")}
      </Button>
    </Link>
  );
}
