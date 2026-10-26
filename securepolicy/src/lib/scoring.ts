import { SSLResult } from "@/lib/scanners/ssl";
import { HIBPResult } from "@/lib/scanners/hibp";
import { DNSResult } from "@/lib/scanners/dns";
import { SecurityHeadersResult } from "@/lib/scanners/headers";
import { ScoreBreakdown } from "@/types";

// Each category maxes out at 25 points so the breakdown sums to the same
// 0-100 total shown on the risk gauge, and each is independently readable
// (e.g. "SSL/TLS: 15/25") on the scan report.
export function sslCategoryScore(ssl: SSLResult): number {
  if (!ssl.hasSSL) return 0;
  if (ssl.expired) return 5;
  if (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry < 30) return 15;
  if (ssl.grade && ["C", "D", "E", "F"].includes(ssl.grade)) return 10;
  return 25;
}

// Returns null (not evaluated) rather than defaulting to a false "clean"
// 25/25 when the check itself failed — HIBP's breacheddomain endpoint only
// works for domains verified in the API key owner's own dashboard, so this
// errors on essentially every third-party domain SecurePilot actually scans.
// A silent 25/25 here was inflating every customer's risk score.
export function dataExposureCategoryScore(hibp: HIBPResult): number | null {
  if (hibp.error) return null;
  if (hibp.compromisedCount > 10) return 0;
  if (hibp.compromisedCount > 3) return 10;
  if (hibp.compromisedCount > 0) return 17;
  return 25;
}

// Same fix as dataExposureCategoryScore/headersCategoryScore: a failed DNS
// lookup (dns.error set — e.g. the upstream DNS-over-HTTPS resolver was
// unreachable) used to silently score as if SPF/DMARC/MX were all
// confirmed absent, which is the opposite failure mode but just as wrong —
// it understated posture instead of overstating it. Caught by an actual
// scan hitting a transient resolver failure and coming back with a
// near-zero score for a domain with correctly configured DNS.
export function dnsEmailCategoryScore(dns: DNSResult): number | null {
  if (dns.error) return null;
  let score = 25;
  if (!dns.hasSPF) score -= 8;
  if (!dns.hasDMARC) score -= 8;
  // Only penalize a confirmed absence — an "unknown" (the selector lookups
  // themselves failed) isn't evidence DKIM is missing, so it isn't scored.
  if (dns.dkimStatus === "not_found") score -= 7;
  if (!dns.hasMX) score -= 2;
  return Math.max(0, score);
}

// Same fix as dataExposureCategoryScore: an errored headers check was also
// silently scoring a perfect 25/25 instead of being excluded.
export function headersCategoryScore(headers: SecurityHeadersResult): number | null {
  if (headers.error) return null;
  const totalHeaders = 6;
  const present = totalHeaders - headers.missingCount;
  return Math.round((present / totalHeaders) * 25);
}

export function computeScoreBreakdown(ssl: SSLResult, hibp: HIBPResult, dns: DNSResult, headers: SecurityHeadersResult): ScoreBreakdown {
  return {
    ssl: sslCategoryScore(ssl),
    dnsEmail: dnsEmailCategoryScore(dns),
    dataExposure: dataExposureCategoryScore(hibp),
    headers: headersCategoryScore(headers),
  };
}

// Sums only the categories that were actually evaluated and rescales to a
// 0-100 total, instead of letting an unevaluated (null) category silently
// count as 0 out of the full 100 — which would understate risk just as
// wrongly as the old code overstated it by scoring it 25/25.
export function calculateRiskScore(breakdown: ScoreBreakdown): number {
  const categories = [breakdown.ssl, breakdown.dnsEmail, breakdown.dataExposure, breakdown.headers];
  const evaluated = categories.filter((c): c is number => c !== null);
  if (evaluated.length === 0) return 0;
  const earned = evaluated.reduce((sum, c) => sum + c, 0);
  const possible = evaluated.length * 25;
  return Math.round((earned / possible) * 100);
}
