import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { CompanyProfile, Policy, PolicyVersion } from "@/types";
import { getEntitlements } from "@/lib/entitlements";
import { resolveBranding } from "@/lib/branding";
import { DownloadPDFButton } from "@/components/policies/DownloadPDFButton";
import { DownloadWordButton } from "@/components/policies/DownloadWordButton";
import { BestPracticesCard } from "@/components/policies/BestPracticesCard";
import { ActionChecklist } from "@/components/policies/ActionChecklist";
import { ComplianceBadges } from "@/components/policies/ComplianceBadges";
import { PolicyImportanceCard } from "@/components/policies/PolicyImportanceCard";
import { AuditEvidenceCard } from "@/components/policies/AuditEvidenceCard";
import { ClientPortalCard } from "@/components/policies/ClientPortalCard";
import { PolicyDetailTabs } from "@/components/policies/PolicyDetailTabs";
import { ExportToWorkspaceButton } from "@/components/policies/ExportToWorkspaceButton";
import { PolicyDetailHeader, RegenerateButton } from "@/components/policies/PolicyDetailHeader";
import { PolicyDetailInfoCard, PolicyDetailScoreCard } from "@/components/policies/PolicyDetailSidebarInfo";

export default async function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: policy } = await supabase
    .from("policies")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (!policy) notFound();

  const p = policy as Policy;

  const [{ data: profile }, { data: accountSettings }, entitlements] = await Promise.all([
    p.client_id
      ? supabase.from("company_profiles").select("company_name").eq("client_id", p.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("account_settings").select("*").eq("user_id", user!.id).maybeSingle(),
    getEntitlements(supabase, user!.id),
  ]);

  const companyName = (profile as Pick<CompanyProfile, "company_name"> | null)?.company_name ?? "Your Company";
  const branding = resolveBranding(accountSettings, entitlements.hasFeature("branding"));

  const { data: versions } = await supabase
    .from("policy_versions")
    .select("*")
    .eq("policy_id", p.id)
    .order("version_number", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <PolicyDetailHeader policy={p} />

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DownloadWordButton policy={p} companyName={companyName} branding={branding} />
          <DownloadPDFButton policy={p} companyName={companyName} branding={branding} />
          {entitlements.hasFeature("confluence_notion") && (
            <>
              <ExportToWorkspaceButton policyId={p.id} provider="notion" />
              <ExportToWorkspaceButton policyId={p.id} provider="confluence" />
            </>
          )}
          <RegenerateButton policyId={p.id} canRegenerate={entitlements.hasFeature("versioning")} />
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
          <PolicyDetailTabs
            policyId={p.id}
            content={p.content}
            currentVersionNumber={p.version_number}
            versions={(versions as PolicyVersion[]) || []}
            showHistory={entitlements.hasFeature("versioning")}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <PolicyDetailInfoCard createdAt={p.created_at} version={p.version} />

          <ClientPortalCard
            policyId={p.id}
            initialEnabled={p.share_enabled ?? false}
            initialToken={p.share_token ?? null}
          />

          {p.security_score && (
            <PolicyDetailScoreCard score={p.security_score.securityScore} riskLevel={p.security_score.riskLevel} />
          )}

          {p.security_score?.policyImportance && (
            <PolicyImportanceCard importance={p.security_score.policyImportance} />
          )}

          {p.security_score?.auditEvidence && p.security_score.auditEvidence.length > 0 && (
            <AuditEvidenceCard evidence={p.security_score.auditEvidence} />
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
