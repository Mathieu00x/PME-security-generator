"use client";
import Link from "next/link";
import { ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Framework } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { FRAMEWORKS } from "@/lib/frameworksData";

export function FrameworksClient({
  versionByKey,
  affectedByKey,
  totalAffected,
  complianceStats,
}: {
  versionByKey: Record<string, Framework>;
  affectedByKey: Record<string, { id: string; title: string; oldVersion: string }[]>;
  totalAffected: number;
  complianceStats: Record<string, { policyCount: number; avgCompliance: number | null }>;
}) {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("frameworks.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("frameworks.subtitle")}</p>
      </div>

      {/* Multi-framework dashboard */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {FRAMEWORKS.map((fw) => {
          const stat = complianceStats[fw.complianceKey];
          const outdated = (affectedByKey[fw.complianceKey] || []).length > 0;
          const pct = stat.avgCompliance;
          const meterColor = pct === null ? "#e5e7eb" : pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";

          return (
            <div key={fw.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-900">{fw.name}</span>
                {outdated && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {t("frameworks.outdatedBadge")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct ?? 0}%`, background: meterColor }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 tabular-nums w-9 text-right">
                  {pct === null ? "—" : `${pct}%`}
                </span>
              </div>

              <p className="text-[10px] text-gray-400">
                {t(stat.policyCount === 1 ? "frameworks.policyCount.one" : "frameworks.policyCount.other", { count: stat.policyCount })}
                {versionByKey[fw.complianceKey] ? ` · v${versionByKey[fw.complianceKey].current_version}` : ""}
              </p>
            </div>
          );
        })}
      </div>

      {totalAffected > 0 && (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {t(totalAffected === 1 ? "frameworks.affectedNotice.one" : "frameworks.affectedNotice.other", { count: totalAffected })}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">{t("frameworks.affectedDesc")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {FRAMEWORKS.map((fw) => {
          const tracked = versionByKey[fw.complianceKey];
          const affected = affectedByKey[fw.complianceKey] || [];
          return (
            <Card key={fw.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${fw.badge}`}>
                      {fw.name}
                    </span>
                    <span className="text-xs text-gray-400">{t(fw.taglineKey)}</span>
                    {tracked && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {t("frameworks.currentVersion", { version: tracked.current_version })}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{t(fw.descKey)}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {t("frameworks.relevantFor")}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {fw.relevantForKeys.map((key) => (
                          <li key={key} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                            {t(key)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {t("frameworks.relatedPolicies")}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {fw.policyKeys.map((key) => (
                          <li key={key} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                            {t(key)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {affected.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        {t("frameworks.affectedListIntro", { count: affected.length })}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {affected.map((a) => (
                          <div key={a.id} className="flex items-center justify-between gap-3">
                            <span className="text-xs text-amber-800">
                              {a.title} <span className="text-amber-500">(v{a.oldVersion})</span>
                            </span>
                            <Link
                              href={`/generate?regenerate=${a.id}`}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline flex-shrink-0"
                            >
                              <RefreshCw size={11} /> {t("frameworks.update")}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t("frameworks.effort")}</p>
                    <p className={`text-xs font-semibold ${fw.effortColor}`}>{t(fw.effortKey)}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <ExternalLink size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">{t("frameworks.footerTitle")}</p>
          <p className="text-xs text-blue-700 mt-0.5">{t("frameworks.footerDesc")}</p>
        </div>
      </div>
    </div>
  );
}
