"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Building2, Check, ChevronDown, FileBarChart, FileText, ListChecks, Map, Plus, Radar, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RemediationTask } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTaskCategoryKey } from "@/lib/taskLabels";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
};

const SEVERITY_LABEL_COLOR: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  medium: "text-yellow-600",
  low: "text-blue-600",
};

export function DashboardClient({
  firstName,
  clientId,
  clientName,
  hasClient,
  hasProfile,
  clientIsQuebec,
  hasScanned,
  currentScore,
  loi25Score,
  pipedaScore,
  complianceDone,
  openFindingsCount,
  criticalOpenCount,
  progressPct,
  hasRemediationProgress,
  topPriorities,
  roadmap,
  outdatedPolicyCount,
  policyCount,
}: {
  firstName: string;
  clientId: string | null;
  clientName: string | null;
  hasClient: boolean;
  hasProfile: boolean;
  clientIsQuebec: boolean;
  hasScanned: boolean;
  currentScore: number | null;
  loi25Score: number | null;
  pipedaScore: number | null;
  complianceDone: boolean;
  openFindingsCount: number;
  criticalOpenCount: number;
  progressPct: number | null;
  hasRemediationProgress: boolean;
  topPriorities: RemediationTask[];
  roadmap: { phase: 1 | 2 | 3; potentialScore: number; actionCount: number }[];
  outdatedPolicyCount: number;
  policyCount: number;
}) {
  const { t, lang } = useLanguage();

  const onboardingDone = hasClient && hasScanned && complianceDone && hasRemediationProgress;

  return (
    <div className="max-w-5xl mx-auto">
      {!onboardingDone && (
        <OnboardingChecklist
          hasClient={hasClient}
          hasScanned={hasScanned}
          clientIsQuebec={clientIsQuebec}
          complianceDone={complianceDone}
          hasRemediationProgress={hasRemediationProgress}
          clientId={clientId}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {clientName ?? t("dashboard.greeting", { name: firstName })}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{hasClient ? t("dashboard.securityOverview") : t("dashboard.subtitle")}</p>
        </div>
        {hasClient && clientId && <CreateDeliverableMenu clientId={clientId} />}
      </div>

      {hasClient && (
        <>
          {/* Cockpit stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label={t("dashboard.cockpit.externalPosture")} value={currentScore !== null ? `${currentScore}/100` : "—"} />
            {clientIsQuebec && (
              <StatCard label={t("dashboard.cockpit.loi25Readiness")} value={loi25Score !== null ? `${loi25Score}%` : "—"} />
            )}
            <StatCard label={t("dashboard.cockpit.pipedaReadiness")} value={pipedaScore !== null ? `${pipedaScore}%` : "—"} />
            <StatCard label={t("dashboard.cockpit.openFindings")} value={String(openFindingsCount)} />
            <StatCard
              label={t("dashboard.cockpit.criticalActions")}
              value={String(criticalOpenCount)}
              valueClassName={criticalOpenCount > 0 ? "text-red-600" : undefined}
            />
            <StatCard label={t("dashboard.cockpit.progress")} value={progressPct !== null ? `${progressPct}%` : "—"} />
          </div>

          {/* Top priorities */}
          <Card className="mb-6" padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{t("dashboard.topPriorities.title")}</h2>
            </div>
            {!hasScanned ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <Radar size={28} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-4">{t("dashboard.topPriorities.noScan")}</p>
                <Link href="/scan"><Button size="sm">{t("dashboard.topPriorities.runScanCta")}</Button></Link>
              </div>
            ) : topPriorities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <Check size={28} className="text-green-400 mb-3" />
                <p className="text-sm text-gray-500">{t("dashboard.topPriorities.allClear")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {topPriorities.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[task.severity]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lang === "fr" ? task.title_fr : task.title_en}
                        </p>
                        <p className="text-xs text-gray-400">{t(getTaskCategoryKey(task) as "tasks.category.tls")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-semibold uppercase ${SEVERITY_LABEL_COLOR[task.severity]}`}>
                        {t(`tasks.severity.${task.severity}`)}
                      </span>
                      <Link href={`/clients/${clientId}/tasks/${task.id}`}>
                        <Button size="sm" variant="outline">
                          {task.status === "open" ? t("dashboard.topPriorities.start") : t("dashboard.topPriorities.view")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                <div className="px-6 py-3">
                  <Link href={`/clients/${clientId}/tasks`} className="text-xs text-blue-600 hover:underline">
                    {t("dashboard.topPriorities.viewAll")}
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Mini roadmap */}
          {roadmap.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{t("dashboard.miniRoadmap.title")}</h2>
                <Link href={`/clients/${clientId}/roadmap`} className="text-xs text-blue-600 hover:underline">
                  {t("dashboard.miniRoadmap.viewFull")}
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t("dashboard.miniRoadmap.now")}</p>
                  <p className="text-xl font-bold text-gray-900">{currentScore ?? "—"}</p>
                  {criticalOpenCount > 0 && <p className="text-[11px] text-red-600 mt-0.5">{t("dashboard.miniRoadmap.criticalCount", { count: criticalOpenCount })}</p>}
                </div>
                {roadmap.map(({ phase, potentialScore, actionCount }) => (
                  <div key={phase}>
                    <p className="text-xs text-gray-400 mb-1">{t(`dashboard.miniRoadmap.phase${phase}`)}</p>
                    <p className="text-xl font-bold text-blue-600">{potentialScore}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t("dashboard.miniRoadmap.actionCount", { count: actionCount })}</p>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-100 mt-4 relative">
                <div className="absolute inset-0 flex justify-between items-center px-0">
                  {[0, 1, 2, 3].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300" />)}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {outdatedPolicyCount > 0 && (
        <div className="mt-2 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
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

      {!hasProfile && hasClient && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">{t("dashboard.completeProfile")}</p>
            <p className="text-xs text-blue-600 mt-0.5">{t("dashboard.completeProfileDesc")}</p>
          </div>
          <Link href={clientId ? `/clients/${clientId}` : "/clients"}>
            <Button size="sm" variant="secondary">{t("dashboard.setUpProfile")}</Button>
          </Link>
        </div>
      )}

      {policyCount === 0 && hasClient && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {t("dashboard.noPoliciesYetHint")} <Link href="/generate" className="text-blue-600 hover:underline">{t("dashboard.generatePolicy")}</Link>
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Card padding="sm">
      <p className="text-[11px] text-gray-400 mb-1 leading-tight">{label}</p>
      <p className={`text-xl font-bold ${valueClassName ?? "text-gray-900"}`}>{value}</p>
    </Card>
  );
}

function CreateDeliverableMenu({ clientId }: { clientId: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const items = [
    { href: `/clients/${clientId}/report`, label: t("dashboard.deliverable.executiveReport"), icon: FileBarChart },
    { href: "/security-score", label: t("dashboard.deliverable.securityAssessment"), icon: Radar },
    { href: "/generate", label: t("dashboard.deliverable.policy"), icon: FileText },
    { href: `/clients/${clientId}/roadmap`, label: t("dashboard.deliverable.roadmapReport"), icon: Map },
  ];

  return (
    <div className="relative">
      <Button onClick={() => setOpen((o) => !o)}>
        <Plus size={16} />
        {t("dashboard.deliverable.cta")}
        <ChevronDown size={14} />
      </Button>
      {open && (
        <div className="absolute right-0 top-11 bg-white border border-gray-100 rounded-lg shadow-lg z-10 w-56 py-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icon size={14} className="text-gray-400" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function OnboardingChecklist({
  hasClient,
  hasScanned,
  clientIsQuebec,
  complianceDone,
  hasRemediationProgress,
  clientId,
}: {
  hasClient: boolean;
  hasScanned: boolean;
  clientIsQuebec: boolean;
  complianceDone: boolean;
  hasRemediationProgress: boolean;
  clientId: string | null;
}) {
  const { t } = useLanguage();

  const steps = [
    {
      done: hasClient,
      icon: Building2,
      label: t("onboarding.step1.label"),
      desc: t("onboarding.step1.desc"),
      cta: t("onboarding.step1.cta"),
      href: "/clients",
    },
    {
      done: hasScanned,
      icon: Radar,
      label: t("onboarding.step2.label"),
      desc: t("onboarding.step2.desc"),
      cta: t("onboarding.step2.cta"),
      href: "/scan",
    },
    {
      done: complianceDone,
      icon: Scale,
      label: clientIsQuebec ? t("onboarding.step3.labelLoi25") : t("onboarding.step3.labelPipeda"),
      desc: clientIsQuebec ? t("onboarding.step3.descLoi25") : t("onboarding.step3.descPipeda"),
      cta: t("onboarding.step3.cta"),
      href: clientId ? `/clients/${clientId}/${clientIsQuebec ? "loi25" : "pipeda"}` : "/clients",
    },
    {
      done: hasRemediationProgress,
      icon: ListChecks,
      label: t("onboarding.step4.label"),
      desc: t("onboarding.step4.desc"),
      cta: t("onboarding.step4.cta"),
      href: clientId ? `/clients/${clientId}/roadmap` : "/clients",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  // Only the first incomplete step gets a call-to-action, so there's always
  // exactly one obvious next action instead of competing buttons.
  const nextStepIndex = steps.findIndex((s) => !s.done);

  return (
    <Card className="mb-6" padding="none">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">{t("onboarding.title")}</h2>
          <span className="text-xs text-gray-400 font-medium">
            {t("onboarding.subtitle", { done: doneCount, total: steps.length })}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isNext = i === nextStepIndex;
          return (
            <div key={step.label} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {step.done ? <Check size={15} className="text-green-600" /> : <Icon size={15} className="text-gray-400" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${step.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{step.desc}</p>
                </div>
              </div>
              {isNext && (
                <Link href={step.href} className="flex-shrink-0">
                  <Button size="sm">{step.cta}</Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
