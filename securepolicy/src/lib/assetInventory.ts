import { SupabaseClient } from "@supabase/supabase-js";
import { SubdomainsResult } from "@/lib/scanners/subdomains";
import { FingerprintResult } from "@/lib/scanners/fingerprint";
import { AssetType } from "@/types";

// Best-effort, never blocks or alters the scan response — same resilience
// contract as generateRemediationTasks(). Records two things per scan:
// 1) which assets (the domain itself + every discovered subdomain) are
//    still observed, via an upsert that only touches last_seen_at/status on
//    conflict — first_seen_at is deliberately absent from the payload so it
//    keeps its default (now()) on insert and is never overwritten later.
// 2) observations tied to this scan's report: technology fingerprints
//    (against the domain asset — fingerprint.ts only checks the root
//    domain today, not each subdomain) and dangling-CNAME findings
//    (against the specific subdomain asset they were found on).
export async function recordAssetObservations(
  supabase: SupabaseClient,
  params: {
    userId: string;
    clientId: string;
    reportId: string;
    domain: string;
    subdomains: SubdomainsResult;
    fingerprint: FingerprintResult;
  }
): Promise<void> {
  const { userId, clientId, reportId, domain, subdomains, fingerprint } = params;

  const assetRows: { user_id: string; client_id: string; type: AssetType; hostname: string; last_seen_at: string; status: "active" }[] = [
    { user_id: userId, client_id: clientId, type: "domain", hostname: domain, last_seen_at: new Date().toISOString(), status: "active" },
    ...subdomains.subdomains.map((hostname) => ({
      user_id: userId,
      client_id: clientId,
      type: "subdomain" as AssetType,
      hostname,
      last_seen_at: new Date().toISOString(),
      status: "active" as const,
    })),
  ];

  const { data: assets, error: assetError } = await supabase
    .from("assets")
    .upsert(assetRows, { onConflict: "client_id,hostname" })
    .select("id, hostname");

  if (assetError || !assets) {
    console.error("recordAssetObservations: asset upsert failed", assetError);
    return;
  }

  const assetIdByHostname = new Map(assets.map((a) => [a.hostname, a.id]));
  const domainAssetId = assetIdByHostname.get(domain);

  const observationRows: {
    asset_id: string;
    report_id: string;
    observation_type: string;
    value: string;
    confidence: "high" | "medium";
    evidence: string;
  }[] = [];

  if (domainAssetId) {
    for (const tech of fingerprint.technologies) {
      observationRows.push({
        asset_id: domainAssetId,
        report_id: reportId,
        observation_type: "technology",
        value: tech.version ? `${tech.technology} ${tech.version}` : tech.technology,
        confidence: tech.confidence,
        evidence: tech.evidence,
      });
    }
  }

  for (const dangling of subdomains.danglingCnames) {
    const assetId = assetIdByHostname.get(dangling.subdomain);
    if (!assetId) continue;
    observationRows.push({
      asset_id: assetId,
      report_id: reportId,
      observation_type: "dangling_cname",
      value: dangling.target,
      confidence: "high",
      evidence: "CNAME target has no DNS answer / matches a provider's unclaimed-resource page",
    });
  }

  if (observationRows.length === 0) return;

  const { error: observationError } = await supabase.from("asset_observations").insert(observationRows);
  if (observationError) {
    console.error("recordAssetObservations: observation insert failed", observationError);
  }
}
