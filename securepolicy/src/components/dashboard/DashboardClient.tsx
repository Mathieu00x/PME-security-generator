"use client";
import Link from "next/link";
import { FileText, TrendingUp, Lightbulb, Download, MoreHorizontal, Plus, AlertTriangle, Radar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Policy, PrioritizedRecommendation } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  "not created": "bg-gray-100 text-gray-500",
};

export function DashboardClient({
  firstName,
  scanCount,
  policies,
  latestScore,
  topRecommendations,
  outdatedPolicyCount,
  clientId,
  hasProfile,
}: {
  firstName: string;
  scanCount: number;
  policies: Policy[];
  latestScore: { securityScore: number; riskLevel: string; recommendations?: unknown[] } | undefined;
  topRecommendations: PrioritizedRecommendation[];
  outdatedPolicyCount: number;
  clientId: string | null;
  hasProfile: boolean;
}) {
  const { t, dateLocale } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto">
      {!scanCount && (
        <Link
          href="/scan"
          className="mb-6 flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Radar size={22} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{t("dashboard.scanBanner.title")}</p>
              <p className="text-sm text-blue-100 mt-0.5">{t("dashboard.scanBanner.subtitle")}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white flex-shrink-0 whitespace-nowrap">
            {t("dashboard.scanBanner.cta")} <ArrowRight size={15} />
          </span>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.greeting", { name: firstName })}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/generate">
          <Button>
            <Plus size={16} />
            {t("dashboard.generateNew")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t("dashboard.policiesGenerated")}</p>
              <p className="text-3xl font-bold text-gray-900">{policies?.length ?? 0}</p>
              <Link href="/policies" className="text-xs text-blue-600 hover:underline mt-2 block">
                {t("dashboard.viewAllPolicies")}
              </Link>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t("dashboard.securityScore")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {latestScore ? latestScore.securityScore : "—"}{latestScore ? " / 100" : ""}
              </p>
              {latestScore && (
                <span className={`text-xs font-medium mt-2 block ${
                  latestScore.securityScore >= 70 ? "text-green-600" : latestScore.securityScore >= 40 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {latestScore.riskLevel} Risk
                </span>
              )}
              <Link href="/security-score" className="text-xs text-blue-600 hover:underline mt-1 block">
                {t("dashboard.viewDetails")}
              </Link>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t("dashboard.recommendations")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {latestScore?.recommendations?.length ?? "—"}
              </p>
              <Link href="/security-score" className="text-xs text-blue-600 hover:underline mt-2 block">
                {t("dashboard.viewRecommendations")}
              </Link>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Lightbulb size={20} className="text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Recent Policies */}
        <Card className="col-span-3" padding="none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t("dashboard.recentPolicies")}</h2>
            <Link href="/policies" className="text-sm text-blue-600 hover:underline">
              {t("dashboard.viewAll")}
            </Link>
          </div>

          {!policies || policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <FileText size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-4">{t("dashboard.noPolicies")}</p>
              <Link href="/generate">
                <Button size="sm">{t("dashboard.generatePolicy")}</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {policies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{policy.title}</p>
                      <p className="text-xs text-gray-400">
                        {t("dashboard.versionDate", {
                          version: policy.version,
                          date: new Date(policy.created_at).toLocaleDateString(dateLocale),
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[policy.status]}`}>
                      {policy.status}
                    </span>
                    <Link href={`/policies/${policy.id}`}>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download size={15} />
                      </button>
                    </Link>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Recommendations */}
        <Card className="col-span-2" padding="none">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t("dashboard.topRecommendations")}</h2>
          </div>
          {!latestScore ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-sm text-gray-400">{t("dashboard.noRecommendations")}</p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-3">
              {topRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb size={11} className="text-amber-500" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.text}</p>
                </div>
              ))}
              <Link href="/security-score" className="text-xs text-blue-600 hover:underline mt-1">
                {t("dashboard.viewAllRecommendations")}
              </Link>
            </div>
          )}
        </Card>
      </div>

      {outdatedPolicyCount > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {t(outdatedPolicyCount === 1 ? "dashboard.needsReview.one" : "dashboard.needsReview.other", { count: outdatedPolicyCount })}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">{t("dashboard.frameworkUpdated")}</p>
            </div>
          </div>
          <Link href="/frameworks">
            <Button size="sm" variant="secondary">{t("dashboard.reviewNow")}</Button>
          </Link>
        </div>
      )}

      {!hasProfile && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">{t("dashboard.completeProfile")}</p>
            <p className="text-xs text-blue-600 mt-0.5">{t("dashboard.completeProfileDesc")}</p>
          </div>
          <Link href={clientId ? `/clients/${clientId}` : "/clients"}>
            <Button size="sm" variant="secondary">{t("dashboard.setUpProfile")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
