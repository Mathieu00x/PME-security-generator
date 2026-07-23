import { createClient } from "@/lib/supabase/server";
import { ArtifactRow, ArtifactType, AuditArtifact, Policy } from "@/types";
import { AuditEvidenceTabs } from "@/components/artifacts/AuditEvidenceTabs";
import { DownloadAuditReportButton } from "@/components/artifacts/DownloadAuditReportButton";
import { AuditEvidencePageHeader } from "@/components/artifacts/AuditEvidencePageHeader";
import { getClientContext } from "@/lib/clientContext";

export default async function AuditEvidencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { clientId, profile, companyName, branding } = await getClientContext(supabase, user!.id);

  const [{ data: artifactRows }, { data: policies }] = await Promise.all([
    clientId ? supabase.from("audit_artifacts").select("*").eq("client_id", clientId) : Promise.resolve({ data: [] }),
    clientId
      ? supabase.from("policies").select("*").eq("client_id", clientId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <AuditEvidencePageHeader companyName={companyName} />
        <DownloadAuditReportButton
          companyProfile={profile}
          policies={(policies as Policy[]) || []}
          artifacts={artifactsByType}
          branding={branding}
        />
      </div>

      <AuditEvidenceTabs artifactsByType={artifactsByType} companyName={companyName} branding={branding} clientId={clientId} />
    </div>
  );
}
