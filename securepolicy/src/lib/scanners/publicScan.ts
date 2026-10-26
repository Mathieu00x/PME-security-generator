import { checkSSL, SSLResult } from "./ssl";
import { checkDNS, DNSResult } from "./dns";
import { checkSecurityHeaders, SecurityHeadersResult } from "./headers";
import { sslCategoryScore, dnsEmailCategoryScore, headersCategoryScore, calculateRiskScore } from "@/lib/scoring";

export interface PublicScanSummary {
  domain: string;
  preliminaryScore: number;
  findingsCount: number;
  criticalCount: number;
}

// Reuses the exact same SSRF-protected scanners as the authenticated scan
// (ssl.ts/dns.ts/headers.ts -> ssrfGuard.ts) — never a separate, possibly
// weaker, code path for the anonymous surface. Deliberately a reduced
// subset: no HIBP (shared API quota, shouldn't be spent on anonymous
// traffic) and no subdomain/fingerprint discovery (slower, and this is a
// teaser, not the full product).
//
// Each check gets its own timeout rather than one timeout wrapped around
// Promise.all([...]) for all three — the first version of this did that,
// and a real test against a live domain caught the bug: when DNS alone ran
// long, the shared race discarded SSL's and headers' results too even
// though both had already finished successfully seconds earlier. Timing
// each check independently means one slow check only ever costs its own
// result, and because all three still run in parallel, total wall time
// stays bounded by the same ~10s ceiling either way.
const CHECK_TIMEOUT_MS = 9_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const SSL_TIMEOUT_FALLBACK: SSLResult = { grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "Timed out" };
const DNS_TIMEOUT_FALLBACK: DNSResult = {
  hasMX: false, hasSPF: false, hasDMARC: false, dkimStatus: "unknown",
  spfRecord: null, dmarcRecord: null, dkimSelector: null, mxRecords: [], error: "Timed out",
};
const HEADERS_TIMEOUT_FALLBACK: SecurityHeadersResult = {
  hasHSTS: false, hasCSP: false, hasXFrameOptions: false, hasXContentTypeOptions: false,
  hasReferrerPolicy: false, hasPermissionsPolicy: false, missingCount: 6, error: "Timed out",
};

// Severity counts mirror the same checks getTriggeredFindingKeys() uses in
// remediationTasks.ts, so "7 findings, 2 critical" on the public teaser is
// never inconsistent with what the authenticated scan would report for the
// same domain — just without the detail (which findings, remediation
// steps) that's reserved for signed-in users.
export async function runPublicScan(domain: string): Promise<PublicScanSummary> {
  const [ssl, dns, headers] = await Promise.all([
    withTimeout(checkSSL(domain), CHECK_TIMEOUT_MS, SSL_TIMEOUT_FALLBACK),
    withTimeout(checkDNS(domain), CHECK_TIMEOUT_MS, DNS_TIMEOUT_FALLBACK),
    withTimeout(checkSecurityHeaders(domain), CHECK_TIMEOUT_MS, HEADERS_TIMEOUT_FALLBACK),
  ]);

  const breakdown = {
    ssl: sslCategoryScore(ssl),
    dnsEmail: dnsEmailCategoryScore(dns),
    dataExposure: null, // never checked on the anonymous teaser — not a failure, deliberately excluded
    headers: headersCategoryScore(headers),
  };
  const preliminaryScore = calculateRiskScore(breakdown);

  let findingsCount = 0;
  let criticalCount = 0;
  if (ssl.hasSSL && ssl.expired) { findingsCount++; criticalCount++; }
  else if (ssl.hasSSL && ssl.grade && ["C", "D", "E", "F"].includes(ssl.grade)) findingsCount++;
  // dns.error must never be read as a confirmed absence of SPF/DMARC —
  // same guard as everywhere else this check's result is used.
  if (!dns.error) {
    if (!dns.hasSPF) findingsCount++;
    if (!dns.hasDMARC) findingsCount++;
    if (dns.dkimStatus === "not_found") findingsCount++;
  }
  if (!headers.error) {
    if (!headers.hasHSTS) findingsCount++;
    if (!headers.hasCSP) findingsCount++;
    if (!headers.hasXFrameOptions) findingsCount++;
  }

  return { domain, preliminaryScore, findingsCount, criticalCount };
}
