import { SupabaseClient } from "@supabase/supabase-js";
import { SSLResult } from "@/lib/scanners/ssl";
import { HIBPResult } from "@/lib/scanners/hibp";
import { DNSResult } from "@/lib/scanners/dns";
import { SecurityHeadersResult } from "@/lib/scanners/headers";
import { FindingKey } from "@/types";

// Derived directly from the raw scanner results, mirroring getRecommendedPolicies()/
// buildFindings() in scan/route.ts — never from the pre-built French findings list.
export function getTriggeredFindingKeys(
  ssl: SSLResult,
  hibp: HIBPResult,
  dns: DNSResult,
  headers: SecurityHeadersResult
): FindingKey[] {
  const keys: FindingKey[] = [];
  if (!dns.hasDMARC) keys.push("dmarc_missing");
  if (!dns.hasSPF) keys.push("spf_missing");
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
  }
): Promise<void> {
  const triggeredKeys = getTriggeredFindingKeys(params.ssl, params.hibp, params.dns, params.securityHeaders);
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
