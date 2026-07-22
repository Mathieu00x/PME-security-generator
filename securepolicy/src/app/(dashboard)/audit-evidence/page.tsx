import { createClient } from "@/lib/supabase/server";
import { ArtifactRow, ArtifactType, AuditArtifact, CompanyProfile, Policy } from "@/types";
import { AuditEvidenceTabs } from "@/components/artifacts/AuditEvidenceTabs";
import { DownloadAuditReportButton } from "@/components/artifacts/DownloadAuditReportButton";
import { resolveBranding } from "@/lib/branding";

export default async function AuditEvidencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: artifactRows }, { data: profile }, { data: policies }] = await Promise.all([
    supabase.from("audit_artifacts").select("*").eq("user_id", user!.id),
    supabase.from("company_profiles").select("*").eq("user_id", user!.id).single(),
    supabase.from("policies").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
  ]);

  const artifactsByType: Record<ArtifactType, ArtifactRow[]> = {
    backup_register: [],
    asset_inventory: [],
    training_register: [],
    incident_register: [],
    access_register: [],
    rights_request_register: [],
    third_party_register: [],
  };
  ((artifactRows as AuditArtifact[]) || []).forEach((a) => {
    artifactsByType[a.type] = a.items || [];
  });

  const companyName = (profile as CompanyProfile | null)?.company_name || "Your Company";
  const branding = resolveBranding(profile as CompanyProfile | null);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Evidence</h1>
          <p className="text-gray-500 text-sm mt-1">
            Maintain the registers auditors and cyber insurers ask for, and export a complete audit package for {companyName}.
          </p>
        </div>
        <DownloadAuditReportButton
          companyProfile={profile as CompanyProfile | null}
          policies={(policies as Policy[]) || []}
          artifacts={artifactsByType}
        />
      </div>

      <AuditEvidenceTabs artifactsByType={artifactsByType} companyName={companyName} branding={branding} />
    </div>
  );
}
