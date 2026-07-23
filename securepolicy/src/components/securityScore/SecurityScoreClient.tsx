"use client";
import Link from "next/link";
import { CheckCircle2, XCircle, Lightbulb, AlertTriangle, Plus, Clock, Target, Quote, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Policy, SecurityScore, ActionItem, PrioritizedRecommendation } from "@/types";
import { ScoreSparkline } from "@/components/policies/ScoreSparkline";
import { useLanguage } from "@/contexts/LanguageContext";

const MATURITY_COLORS: Record<string, { bg: string; text: string }> = {
  Basic:      { bg: "bg-red-100",    text: "text-red-700"    },
  Developing: { bg: "bg-orange-100", text: "text-orange-700" },
  Defined:    { bg: "bg-yellow-100", text: "text-yellow-700" },
  Advanced:   { bg: "bg-green-100",  text: "text-green-700"  },
};

const MATURITY_KEY: Record<string, string> = {
  Basic: "securityScore.maturity.basic",
  Developing: "securityScore.maturity.developing",
  Defined: "securityScore.maturity.defined",
  Advanced: "securityScore.maturity.advanced",
};

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low:    "bg-blue-100 text-blue-600",
};

const PRIORITY_KEY: Record<string, string> = {
  high:   "securityScore.priority.high",
  medium: "securityScore.priority.medium",
  low:    "securityScore.priority.low",
};

function ScoreRing({ score }: { score: number }) {
  const { t } = useLanguage();
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? t("securityScore.ring.good") : score >= 40 ? t("securityScore.ring.fair") : t("securityScore.ring.poor");
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill="#0f172a" fontSize="28" fontWeight="700">{score}</text>
        <text x="70" y="83" textAnchor="middle" fill="#94a3b8" fontSize="12">/100</text>
      </svg>
      <span style={{ color }} className="text-sm font-semibold mt-1">{label}</span>
    </div>
  );
}

export function SecurityScoreClient({
  allPolicies,
  latestScore,
  allStrengths,
  allWeaknesses,
  allActionItems,
  recommendations,
  avgScore,
  latestPolicy,
  scoreHistory,
}: {
  allPolicies: Policy[];
  latestScore: SecurityScore | undefined;
  allStrengths: string[];
  allWeaknesses: string[];
  allActionItems: ActionItem[];
  recommendations: PrioritizedRecommendation[];
  avgScore: number;
  latestPolicy: Policy | undefined;
  scoreHistory: { policy: Policy; scores: number[] }[];
}) {
  const { t } = useLanguage();

  if (!latestScore) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("securityScore.noScoreTitle")}</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">{t("securityScore.noScoreDesc")}</p>
        <Link href="/generate">
          <Button>
            <Plus size={16} /> {t("securityScore.generateFirst")}
          </Button>
        </Link>
      </div>
    );
  }

  const maturity = latestScore.maturityLevel ?? "Basic";
  const maturityStyle = MATURITY_COLORS[maturity] ?? MATURITY_COLORS.Basic;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.securityScore")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t(allPolicies.length === 1 ? "securityScore.subtitle.one" : "securityScore.subtitle.other", { count: allPolicies.length })}
        </p>
      </div>

      {/* Executive Summary */}
      {latestScore.executiveSummary && (
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
          <Quote size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
              {t("securityScore.execSummary")}{latestPolicy ? ` — ${latestPolicy.title}` : ""}
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">{latestScore.executiveSummary}</p>
          </div>
        </div>
      )}

      {/* Score overview */}
      <Card className="mb-4">
        <div className="flex items-center gap-12">
          <ScoreRing score={avgScore} />
          <div className="flex-1 grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("securityScore.maturityLevel")}</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${maturityStyle.bg} ${maturityStyle.text}`}>
                {MATURITY_KEY[maturity] ? t(MATURITY_KEY[maturity]) : maturity}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("securityScore.strengths")}</p>
              <p className="text-2xl font-bold text-green-600">{allStrengths.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("securityScore.weaknesses")}</p>
              <p className="text-2xl font-bold text-red-500">{allWeaknesses.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Score History */}
      {scoreHistory.length > 0 && (
        <Card className="mb-4">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            {t("securityScore.scoreHistory")}
          </h2>
          <p className="text-xs text-gray-400 mb-4">{t("securityScore.scoreHistoryDesc")}</p>
          <div className="grid grid-cols-2 gap-3">
            {scoreHistory.map(({ policy, scores }) => {
              const first = scores[0];
              const last = scores[scores.length - 1];
              const delta = last - first;
              return (
                <div key={policy.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{policy.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {delta > 0 && <TrendingUp size={12} className="text-green-600" />}
                      {delta < 0 && <TrendingDown size={12} className="text-red-500" />}
                      {delta === 0 && <Minus size={12} className="text-gray-400" />}
                      <span className={`text-xs font-medium ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {delta > 0 ? "+" : ""}{delta} pts {scores.length > 1 ? t("securityScore.overVersions", { count: scores.length }) : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ScoreSparkline scores={scores} />
                    <span className="text-lg font-bold text-gray-900 tabular-nums w-8 text-right">{last}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Strengths */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            {t("securityScore.strengths")}
          </h2>
          <div className="flex flex-col gap-2.5">
            {allStrengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{s}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Weaknesses */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            {t("securityScore.weaknesses")}
          </h2>
          <div className="flex flex-col gap-2.5">
            {allWeaknesses.map((w, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{w}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Prioritized Action Plan */}
      {allActionItems.length > 0 && (
        <Card className="mb-4">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            {t("securityScore.actionPlan")}
          </h2>
          <div className="flex flex-col gap-3">
            {allActionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${PRIORITY_STYLE[item.priority]}`}>
                      {t(PRIORITY_KEY[item.priority])}
                    </span>
                    {item.estimatedTime && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={9} /> {item.estimatedTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{item.task}</p>
                  {item.tool && (
                    <p className="text-xs text-blue-600 mt-1">→ {item.tool}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Gap Analysis */}
      {latestScore.gapAnalysis && (
        <Card className="mb-4">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Target size={16} className="text-purple-500" />
            {t("securityScore.gapAnalysis")}{latestPolicy ? ` — ${latestPolicy.title}` : ""}
          </h2>
          <p className="text-xs text-gray-400 mb-4">{t("securityScore.gapAnalysisDesc")}</p>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("securityScore.currentCompliance")}</p>
              <p className="text-2xl font-bold text-gray-900">{latestScore.gapAnalysis.compliancePercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("securityScore.missingControls")}</p>
              <p className="text-2xl font-bold text-red-500">{latestScore.gapAnalysis.missingControlsCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("securityScore.associatedRisk")}</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                latestScore.gapAnalysis.associatedRisk === "High" ? "bg-red-100 text-red-700"
                : latestScore.gapAnalysis.associatedRisk === "Medium" ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
              }`}>
                {latestScore.gapAnalysis.associatedRisk}
              </span>
            </div>
          </div>
          {latestScore.gapAnalysis.missingControls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {latestScore.gapAnalysis.missingControls.map((mc, i) => (
                <span key={i} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-100">
                  {mc}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recommendations */}
      <Card className="mb-4">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          {t("securityScore.recommendations")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lightbulb size={11} className="text-amber-600" />
              </div>
              <div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${PRIORITY_STYLE[rec.priority]}`}>
                  {t(PRIORITY_KEY[rec.priority])}
                </span>
                <p className="text-sm text-gray-700 mt-1">{rec.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {latestScore.missingPolicies && latestScore.missingPolicies.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            {t("securityScore.missingPolicies")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {latestScore.missingPolicies.map((mp, i) => (
              <span key={i} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                {mp}
              </span>
            ))}
          </div>
          <Link href="/generate" className="mt-4 inline-block">
            <Button size="sm" variant="secondary">
              <Plus size={14} /> {t("securityScore.generateMissing")}
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
