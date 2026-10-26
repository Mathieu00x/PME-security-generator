import { SupabaseClient } from "@supabase/supabase-js";
import { SSLResult } from "@/lib/scanners/ssl";
import { HIBPResult } from "@/lib/scanners/hibp";
import { DNSResult } from "@/lib/scanners/dns";
import { SecurityHeadersResult } from "@/lib/scanners/headers";
import { SubdomainsResult } from "@/lib/scanners/subdomains";
import { FindingKey } from "@/types";

// Derived directly from the raw scanner results, mirroring getRecommendedPolicies()/
// buildFindings() in scan/route.ts — never from the pre-built French findings list.
export function getTriggeredFindingKeys(
  ssl: SSLResult,
  hibp: HIBPResult,
  dns: DNSResult,
  headers: SecurityHeadersResult,
  subdomains: SubdomainsResult
): FindingKey[] {
  const keys: FindingKey[] = [];
  // dns.error (the lookup itself failed) must never be read as a confirmed
  // absence — same guard already applied to hibp/headers below, missing
  // here until a real scan hit a transient resolver failure and generated
  // false dmarc_missing/spf_missing tasks for a domain with both configured.
  if (!dns.error && !dns.hasDMARC) keys.push("dmarc_missing");
  if (!dns.error && !dns.hasSPF) keys.push("spf_missing");
  // "unknown" (DNS lookups themselves failed) is not evidence of absence —
  // only "not_found" (lookups succeeded, no match under common selectors) triggers.
  if (dns.dkimStatus === "not_found") keys.push("dkim_not_detected");
  if (ssl.hasSSL && ssl.expired) keys.push("ssl_expired");
  else if (ssl.hasSSL && ssl.grade && ["C", "D", "E", "F"].includes(ssl.grade)) keys.push("ssl_weak_protocol");
  if (!headers.error && !headers.hasHSTS) keys.push("hsts_missing");
  if (!headers.error && !headers.hasCSP) keys.push("csp_missing");
  // hibp.error must never be treated as "clean" — only a confirmed, successful
  // check with compromisedCount > 0 triggers, mirroring dataExposureCategoryScore().
  if (!hibp.error && hibp.compromisedCount > 0) keys.push("hibp_breach_detected");
  // One task regardless of how many dangling CNAMEs were found, same
  // one-task-per-control granularity as every other finding here — which
  // subdomain(s) are affected isn't snapshotted into the task today, same
  // limitation as e.g. ssl_expired not embedding "expires in 12 days".
  if (subdomains.danglingCnames.length > 0) keys.push("subdomain_takeover_risk");
  return keys;
}

export async function generateRemediationTasks(
  supabase: SupabaseClient,
  params: {
    userId: string;
    clientId: string;
    scanId: string;
    ssl: SSLResult;
    hibp: HIBPResult;
    dns: DNSResult;
    securityHeaders: SecurityHeadersResult;
    subdomains: SubdomainsResult;
  }
): Promise<void> {
  const triggeredKeys = getTriggeredFindingKeys(
    params.ssl,
    params.hibp,
    params.dns,
    params.securityHeaders,
    params.subdomains
  );

  // Run reconciliation against the full triggered set (possibly empty, on a
  // clean scan) regardless of whether there's anything new to insert below —
  // a clean scan is exactly the case where every previously "completed" task
  // should flip to "verified".
  await verifyResolvedScanTasks(supabase, params.clientId, triggeredKeys);

  if (triggeredKeys.length === 0) return;

  const { data: kbRows, error } = await supabase.from("kb_controls").select("*").in("finding_key", triggeredKeys);

  if (error) {
    console.error("generateRemediationTasks: kb_controls lookup failed", error);
    return;
  }
  if (!kbRows?.length) return;

  const missing = triggeredKeys.filter((k) => !kbRows.some((r) => r.finding_key === k));
  if (missing.length) {
    console.error("generateRemediationTasks: no kb_controls row for finding_key(s):", missing);
  }

  const rows = kbRows.map((kb) => ({
    user_id: params.userId,
    client_id: params.clientId,
    scan_id: params.scanId,
    control_code: kb.code,
    source: "scan",
    finding_key: kb.finding_key,
    category: kb.category,
    severity: kb.finding_key === "hibp_breach_detected" && params.hibp.compromisedCount > 5 ? "high" : kb.severity,
    phase: kb.phase,
    title_fr: kb.title_fr,
    title_en: kb.title_en,
    why_it_matters_fr: kb.why_it_matters_fr,
    why_it_matters_en: kb.why_it_matters_en,
    business_impact_fr: kb.business_impact_fr,
    business_impact_en: kb.business_impact_en,
    remediation_steps_fr: kb.remediation_steps_fr,
    remediation_steps_en: kb.remediation_steps_en,
    evidence_required_fr: kb.evidence_required_fr,
    evidence_required_en: kb.evidence_required_en,
    framework_mappings: {
      nist_csf: kb.nist_csf,
      cis_controls: kb.cis_controls,
      iso_27001: kb.iso_27001,
      loi_25: kb.loi_25,
      pipeda: kb.pipeda,
      soc2: kb.soc2,
    },
  }));

  // Dedup rule: never recreate a row for a (client_id, control_code) pair that
  // already exists, regardless of status. Enforced entirely at the DB level via
  // the unique constraint on (client_id, control_code) + ignoreDuplicates — no
  // pre-check SELECT, so this is race-safe for near-simultaneous scans (two
  // tabs, double-click). This must be a plain unique constraint, not a partial
  // index — PostgREST's upsert generates a bare `ON CONFLICT (columns)` with no
  // way to repeat a partial index's WHERE predicate, so a partial index here
  // fails with "no unique or exclusion constraint matching" (42P10).
  const { error: insertError } = await supabase
    .from("remediation_tasks")
    .upsert(rows, { onConflict: "client_id,control_code", ignoreDuplicates: true });

  if (insertError) {
    console.error("generateRemediationTasks: insert failed", insertError);
  }
}

// A technician marking a task "completed" is a claim, not proof. The only
// thing that upgrades it to "verified" is SecurePilot itself re-checking: if
// a scan-sourced task is "completed" and this fresh scan no longer triggers
// its finding_key, that's real evidence the fix held. Deliberately one-way —
// a regression (finding reappears later) does not auto-reopen a verified
// task; see the "re-open on regression" note in generateRemediationTasks'
// dedup rule above, same tradeoff, documented rather than silently assumed.
async function verifyResolvedScanTasks(
  supabase: SupabaseClient,
  clientId: string,
  triggeredKeys: FindingKey[]
): Promise<void> {
  const { data: completedTasks, error } = await supabase
    .from("remediation_tasks")
    .select("id, finding_key")
    .eq("client_id", clientId)
    .eq("source", "scan")
    .eq("status", "completed")
    .not("finding_key", "is", null);

  if (error) {
    console.error("verifyResolvedScanTasks: lookup failed", error);
    return;
  }

  const resolvedIds = (completedTasks ?? [])
    .filter((t) => !triggeredKeys.includes(t.finding_key as FindingKey))
    .map((t) => t.id);
  if (resolvedIds.length === 0) return;

  const { error: updateError } = await supabase
    .from("remediation_tasks")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .in("id", resolvedIds);

  if (updateError) {
    console.error("verifyResolvedScanTasks: update failed", updateError);
  }
}
