"use client";
import Link from "next/link";
import { Radar, Map } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { projectScoreThroughPhase } from "@/lib/roadmapProjection";
import { AttackSurfaceReport, Client, KBSeverity, RemediationTask } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const SEVERITY_STYLE: Record<KBSeverity, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-600",
};

export function RoadmapClient({
  client,
  tasks,
  latestScan,
}: {
  client: Client;
  tasks: RemediationTask[];
  latestScan: AttackSurfaceReport | null;
}) {
  const { t, lang } = useLanguage();

  if (!latestScan) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t("roadmap.title")}</h1>
        <Card className="text-center py-12 mt-6">
          <Radar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 text-sm mb-4">{t("roadmap.noScan")}</p>
          <Link href="/scan">
            <Button size="sm">{t("roadmap.noScanCta")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const openTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "verified");
  const pendingVerificationCount = tasks.filter((t) => t.status === "completed").length;
  const phases: (1 | 2 | 3)[] = [1, 2, 3];
  const currentScore = latestScan.risk_score;
  const breakdown = latestScan.score_breakdown ?? { ssl: 0, dnsEmail: 0, dataExposure: null, headers: null };

  const projections = phases.map((phase) => ({
    phase,
    score: projectScoreThroughPhase(breakdown, openTasks, phase),
    items: tasks.filter((t) => t.phase === phase),
  }));
  // The "potential" headline is the phase-3 projection: every category touched
  // by a remaining open/in_progress task reaches its ceiling. It is a ceiling
  // assuming full completion AND verification — never a guaranteed outcome —
  // which is exactly why it's labeled separately from currentScore (the real,
  // last-scanned number) rather than blended into one trajectory.
  const potentialScore = projections[2]?.score ?? currentScore;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Map size={18} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">{t("roadmap.title")}</h1>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-6 mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t("roadmap.currentScore")}</p>
            <p className="text-2xl font-bold text-gray-900">{currentScore}<span className="text-sm text-gray-400">/100</span></p>
          </div>
          <div className="text-gray-300">→</div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t("roadmap.potentialScore")}</p>
            <p className="text-2xl font-bold text-blue-600">{potentialScore}<span className="text-sm text-gray-400">/100</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap mb-2">
          {["open", "completed", "verificationRequired", "rescan", "verified"].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full bg-gray-100">{t(`roadmap.pipeline.${step}`)}</span>
              {i < arr.length - 1 && <span>→</span>}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 italic">{t("roadmap.verificationDisclaimer")}</p>
        {pendingVerificationCount > 0 && (
          <p className="text-xs text-amber-600 mt-1.5">{t("roadmap.pendingVerificationCount", { count: pendingVerificationCount })}</p>
        )}
      </Card>

      <div className="flex flex-col gap-6">
        {projections.map(({ phase, score, items }) => {
          if (items.length === 0) return null;
          const severityCounts: Record<KBSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
          items.forEach((item) => severityCounts[item.severity]++);

          return (
            <Card key={phase}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">{t(`tasks.phase.${phase}`)}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {(Object.keys(severityCounts) as KBSeverity[])
                    .filter((s) => severityCounts[s] > 0)
                    .map((s) => (
                      <span key={s} className={`px-1.5 py-0.5 rounded-full font-semibold ${SEVERITY_STYLE[s]}`}>
                        {severityCounts[s]} {t(`tasks.severity.${s}`)}
                      </span>
                    ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/clients/${client.id}/tasks/${item.id}`}
                    className="flex items-center justify-between text-sm py-1.5 border-t border-gray-100 first:border-t-0 hover:text-blue-600"
                  >
                    <span className="text-gray-700">{lang === "fr" ? item.title_fr : item.title_en}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${SEVERITY_STYLE[item.severity]}`}>
                      {t(`tasks.severity.${item.severity}`)}
                    </span>
                  </Link>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {t("roadmap.projectedScore", { score })}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
