import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Policy } from "@/types";
import { Logo } from "@/components/ui/Logo";
import { PolicyViewer } from "@/components/policies/PolicyViewer";
import { ComplianceBadges } from "@/components/policies/ComplianceBadges";
import { BestPracticesCard } from "@/components/policies/BestPracticesCard";
import { ActionChecklist } from "@/components/policies/ActionChecklist";
import { Shield } from "lucide-react";

export default async function SharedPolicyPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();

  const { data: policy } = await supabase
    .from("policies")
    .select("*")
    .eq("share_token", params.token)
    .eq("share_enabled", true)
    .single();

  if (!policy) notFound();

  const p = policy as Policy;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            Read-only client portal
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Version {p.version} · {new Date(p.updated_at).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {p.security_score?.complianceMapping && (
          <div className="mb-4">
            <ComplianceBadges mapping={p.security_score.complianceMapping} />
          </div>
        )}

        {p.security_score?.executiveSummary && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Executive Summary</p>
            <p className="text-sm text-blue-800 leading-relaxed">{p.security_score.executiveSummary}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <PolicyViewer content={p.content} />
          </div>

          <div className="flex flex-col gap-4">
            {p.security_score && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <Shield size={14} className="text-blue-500" />
                  Security Score
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                    style={{
                      background: p.security_score.securityScore >= 70
                        ? "#22c55e"
                        : p.security_score.securityScore >= 40
                        ? "#f59e0b"
                        : "#ef4444",
                    }}
                  >
                    {p.security_score.securityScore}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">out of 100</p>
                    <p className="text-sm font-medium text-gray-700">{p.security_score.riskLevel} Risk</p>
                  </div>
                </div>
              </div>
            )}

            {p.security_score?.bestPractices && (
              <BestPracticesCard bestPractices={p.security_score.bestPractices} />
            )}

            {p.security_score?.actionItems && p.security_score.actionItems.length > 0 && (
              <ActionChecklist actionItems={p.security_score.actionItems} />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          This is a shared, read-only view generated with SecurePilot.
        </p>
      </div>
    </div>
  );
}
