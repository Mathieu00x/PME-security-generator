import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2, XCircle, Lightbulb, AlertTriangle, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Policy, SecurityScore } from "@/types";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Good" : score >= 40 ? "Fair" : "Poor";
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
        <text x="70" y="65" textAnchor="middle" className="text-3xl font-bold" fill="#0f172a" fontSize="28" fontWeight="700">{score}</text>
        <text x="70" y="83" textAnchor="middle" fill="#94a3b8" fontSize="12">/100</text>
      </svg>
      <span style={{ color }} className="text-sm font-semibold mt-1">{label}</span>
    </div>
  );
}

export default async function SecurityScorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: policies } = await supabase
    .from("policies")
    .select("*")
    .eq("user_id", user!.id)
    .not("security_score", "is", null)
    .order("created_at", { ascending: false });

  const latestScore = (policies as Policy[] | null)?.[0]?.security_score as SecurityScore | undefined;

  if (!latestScore) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No Security Score Yet</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">
          Generate your first security policy and we&apos;ll automatically calculate your security score with strengths, weaknesses, and recommendations.
        </p>
        <Link href="/generate">
          <Button>
            <Plus size={16} /> Generate First Policy
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Security Score</h1>
        <p className="text-gray-500 text-sm mt-1">Based on your latest generated policy.</p>
      </div>

      {/* Score overview */}
      <Card className="mb-4">
        <div className="flex items-center gap-12">
          <ScoreRing score={latestScore.securityScore} />
          <div className="flex-1 grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Risk Level</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                latestScore.riskLevel === "Low" ? "bg-green-100 text-green-700" :
                latestScore.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {latestScore.riskLevel} Risk
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Strengths</p>
              <p className="text-2xl font-bold text-green-600">{latestScore.strengths.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Weaknesses</p>
              <p className="text-2xl font-bold text-red-500">{latestScore.weaknesses.length}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Strengths */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            Strengths
          </h2>
          <div className="flex flex-col gap-2.5">
            {latestScore.strengths.map((s, i) => (
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
            Weaknesses
          </h2>
          <div className="flex flex-col gap-2.5">
            {latestScore.weaknesses.map((w, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{w}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          Top Recommendations
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {latestScore.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lightbulb size={11} className="text-amber-600" />
              </div>
              <p className="text-sm text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      </Card>

      {latestScore.missingPolicies && latestScore.missingPolicies.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            Missing Policies
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
              <Plus size={14} /> Generate missing policies
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
