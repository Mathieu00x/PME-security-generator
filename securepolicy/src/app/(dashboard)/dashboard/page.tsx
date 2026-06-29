import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, TrendingUp, Lightbulb, Download, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Policy } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  "not created": "bg-gray-100 text-gray-500",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: policies } = await supabase
    .from("policies")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";

  // Get latest security score from most recent policy
  const latestScore = (policies as Policy[] | null)?.find((p) => p.security_score)?.security_score;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here&apos;s an overview of your security.</p>
        </div>
        <Link href="/generate">
          <Button>
            <Plus size={16} />
            Generate New Policy
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Policies Generated</p>
              <p className="text-3xl font-bold text-gray-900">{policies?.length ?? 0}</p>
              <Link href="/policies" className="text-xs text-blue-600 hover:underline mt-2 block">
                View all policies →
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
              <p className="text-sm text-gray-500 mb-1">Security Score</p>
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
                View details →
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
              <p className="text-sm text-gray-500 mb-1">Recommendations</p>
              <p className="text-3xl font-bold text-gray-900">
                {latestScore?.recommendations?.length ?? "—"}
              </p>
              <Link href="/security-score" className="text-xs text-blue-600 hover:underline mt-2 block">
                View recommendations →
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
            <h2 className="font-semibold text-gray-900">Recent Policies</h2>
            <Link href="/policies" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {!policies || policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <FileText size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-4">No policies yet. Generate your first one!</p>
              <Link href="/generate">
                <Button size="sm">Generate Policy</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(policies as Policy[]).map((policy) => (
                <div key={policy.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{policy.title}</p>
                      <p className="text-xs text-gray-400">Version {policy.version} · {new Date(policy.created_at).toLocaleDateString("en-CA")}</p>
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
            <h2 className="font-semibold text-gray-900">Top Recommendations</h2>
          </div>
          {!latestScore ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-sm text-gray-400">Generate a policy to see recommendations.</p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-3">
              {latestScore.recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb size={11} className="text-amber-500" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{rec}</p>
                </div>
              ))}
              <Link href="/security-score" className="text-xs text-blue-600 hover:underline mt-1">
                View All Recommendations →
              </Link>
            </div>
          )}
        </Card>
      </div>

      {!profile && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Complete your company profile</p>
            <p className="text-xs text-blue-600 mt-0.5">Add your company details for more accurate and personalized policies.</p>
          </div>
          <Link href="/company-profile">
            <Button size="sm" variant="secondary">Set up profile →</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
