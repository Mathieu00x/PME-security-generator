import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Policy } from "@/types";
import { PolicyViewer } from "@/components/policies/PolicyViewer";
import { DownloadPDFButton } from "@/components/policies/DownloadPDFButton";
import { DownloadWordButton } from "@/components/policies/DownloadWordButton";
import { BestPracticesCard } from "@/components/policies/BestPracticesCard";
import { ActionChecklist } from "@/components/policies/ActionChecklist";
import { ComplianceBadges } from "@/components/policies/ComplianceBadges";

export default async function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: policy }, { data: profile }] = await Promise.all([
    supabase.from("policies").select("*").eq("id", params.id).eq("user_id", user!.id).single(),
    supabase.from("company_profiles").select("company_name").eq("user_id", user!.id).single(),
  ]);

  if (!policy) notFound();

  const p = policy as Policy;
  const companyName = profile?.company_name ?? "Your Company";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/policies">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{p.title}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium capitalize">
                {p.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Version {p.version} · {new Date(p.created_at).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DownloadWordButton policy={p} companyName={companyName} />
          <DownloadPDFButton policy={p} companyName={companyName} />
          <Link href={`/generate?regenerate=${p.id}`}>
            <Button variant="outline" size="sm">
              <RefreshCw size={14} />
              Regenerate
            </Button>
          </Link>
        </div>
      </div>

      {/* Compliance badges */}
      {p.security_score?.complianceMapping && (
        <div className="mb-4">
          <ComplianceBadges mapping={p.security_score.complianceMapping} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Document */}
        <div className="col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
            {["Overview", "Document", "Version History"].map((tab) => (
              <button
                key={tab}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === "Document"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "Overview" && <FileText size={13} />}
                {tab === "Document" && <FileText size={13} />}
                {tab === "Version History" && <Clock size={13} />}
                {tab}
              </button>
            ))}
          </div>
          <PolicyViewer content={p.content} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Information</h3>
            <dl className="flex flex-col gap-2.5">
              {[
                { label: "Policy Owner", value: "IT Department" },
                { label: "Review Date", value: new Date(new Date(p.created_at).setFullYear(new Date(p.created_at).getFullYear() + 1)).toLocaleDateString("en-CA") },
                { label: "Next Review", value: "In 12 months" },
                { label: "Version", value: p.version },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-sm text-gray-700 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {p.security_score && (
            <Card padding="sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Security Score</h3>
              <div className="flex items-center gap-3 mb-3">
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
              <Link href="/security-score" className="text-xs text-blue-600 hover:underline">
                View full security report →
              </Link>
            </Card>
          )}

          {p.security_score?.bestPractices && (
            <BestPracticesCard bestPractices={p.security_score.bestPractices} />
          )}

          {p.security_score?.actionItems && p.security_score.actionItems.length > 0 && (
            <ActionChecklist actionItems={p.security_score.actionItems} />
          )}
        </div>
      </div>
    </div>
  );
}
