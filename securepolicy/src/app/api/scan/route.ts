import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSSL, SSLResult } from "@/lib/scanners/ssl";
import { checkHIBP, HIBPResult } from "@/lib/scanners/hibp";
import { checkSubdomains, SubdomainsResult } from "@/lib/scanners/subdomains";
import { checkDNS, DNSResult } from "@/lib/scanners/dns";
import { checkSecurityHeaders, SecurityHeadersResult } from "@/lib/scanners/headers";
import { PolicyType, ScanFinding, ScoreBreakdown } from "@/types";
import { getActiveClientId } from "@/lib/activeClient";
import { checkRateLimit } from "@/lib/rateLimit";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;

// Each category maxes out at 25 points so the breakdown sums to the same
// 0-100 total shown on the risk gauge, and each is independently readable
// (e.g. "SSL/TLS: 15/25") on the scan report.
function sslCategoryScore(ssl: SSLResult): number {
  if (!ssl.hasSSL) return 0;
  if (ssl.expired) return 5;
  if (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry < 30) return 15;
  if (ssl.grade && ["C", "D", "E", "F"].includes(ssl.grade)) return 10;
  return 25;
}

function dataExposureCategoryScore(hibp: HIBPResult): number {
  if (hibp.compromisedCount > 10) return 0;
  if (hibp.compromisedCount > 3) return 10;
  if (hibp.compromisedCount > 0) return 17;
  return 25;
}

function dnsEmailCategoryScore(dns: DNSResult): number {
  let score = 25;
  if (!dns.hasSPF) score -= 8;
  if (!dns.hasDMARC) score -= 8;
  if (!dns.hasDKIM) score -= 7;
  if (!dns.hasMX) score -= 2;
  return Math.max(0, score);
}

function headersCategoryScore(headers: SecurityHeadersResult): number {
  if (headers.error) return 25;
  const totalHeaders = 6;
  const present = totalHeaders - headers.missingCount;
  return Math.round((present / totalHeaders) * 25);
}

function computeScoreBreakdown(ssl: SSLResult, hibp: HIBPResult, dns: DNSResult, headers: SecurityHeadersResult): ScoreBreakdown {
  return {
    ssl: sslCategoryScore(ssl),
    dnsEmail: dnsEmailCategoryScore(dns),
    dataExposure: dataExposureCategoryScore(hibp),
    headers: headersCategoryScore(headers),
  };
}

function calculateRiskScore(breakdown: ScoreBreakdown): number {
  return breakdown.ssl + breakdown.dnsEmail + breakdown.dataExposure + breakdown.headers;
}

function getRecommendedPolicies(ssl: SSLResult, hibp: HIBPResult, dns: DNSResult): PolicyType[] {
  const policies: PolicyType[] = [];

  if (hibp.compromisedCount > 0) {
    policies.push("password");
    policies.push("incident-response");
  }
  if (!ssl.hasSSL || ssl.expired || (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry < 30)) {
    policies.push("remote-work");
  }
  if (!dns.hasSPF || !dns.hasDMARC || !dns.hasDKIM) {
    policies.push("acceptable-use");
  }
  if (!policies.includes("backup")) policies.push("backup");

  return Array.from(new Set(policies));
}

function buildFindings(ssl: SSLResult, hibp: HIBPResult, subdomains: SubdomainsResult, dns: DNSResult, headers: SecurityHeadersResult): ScanFinding[] {
  const findings: ScanFinding[] = [];

  if (!ssl.hasSSL) {
    findings.push({ severity: "high", category: "SSL", message: "Aucun certificat SSL détecté" });
  } else if (ssl.expired) {
    findings.push({ severity: "high", category: "SSL", message: "Certificat SSL expiré" });
  } else if (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry < 30) {
    findings.push({ severity: "medium", category: "SSL", message: `Certificat SSL expire dans ${ssl.daysUntilExpiry} jours` });
  } else if (ssl.grade) {
    const isGood = ["A+", "A", "A-", "B"].includes(ssl.grade);
    findings.push({
      severity: isGood ? "low" : "medium",
      category: "SSL",
      message: `Grade SSL : ${ssl.grade}`,
    });
  }

  if (hibp.compromisedCount > 0) {
    findings.push({
      severity: hibp.compromisedCount > 5 ? "high" : "medium",
      category: "Fuites de données",
      message: `${hibp.compromisedCount} compte(s) d'employé compromis détectés`,
    });
  } else if (!hibp.error) {
    findings.push({ severity: "low", category: "Fuites de données", message: "Aucun email compromis détecté" });
  }

  if (!dns.hasSPF) {
    findings.push({ severity: "medium", category: "DNS", message: "Aucun enregistrement SPF configuré (risque de spoofing)" });
  }
  if (!dns.hasDMARC) {
    findings.push({ severity: "medium", category: "DNS", message: "Aucun enregistrement DMARC configuré" });
  }
  if (!dns.hasDKIM) {
    findings.push({ severity: "medium", category: "DNS", message: "Aucune signature DKIM détectée (sélecteurs courants)" });
  }
  if (dns.hasSPF && dns.hasDMARC && dns.hasDKIM) {
    findings.push({ severity: "low", category: "DNS", message: "SPF, DKIM et DMARC correctement configurés" });
  }

  findings.push({
    severity: "low",
    category: "Sous-domaines",
    message: `${subdomains.count} sous-domaine(s) exposé(s) détecté(s)`,
  });

  if (!headers.error) {
    if (!headers.hasHSTS) {
      findings.push({ severity: "medium", category: "En-têtes de sécurité", message: "HSTS non activé (risque de rétrogradation HTTP)" });
    }
    if (!headers.hasCSP) {
      findings.push({ severity: "medium", category: "En-têtes de sécurité", message: "Aucune Content-Security-Policy configurée (risque XSS accru)" });
    }
    if (!headers.hasXFrameOptions) {
      findings.push({ severity: "medium", category: "En-têtes de sécurité", message: "Aucune protection contre le clickjacking (X-Frame-Options)" });
    }
    if (!headers.hasXContentTypeOptions) {
      findings.push({ severity: "low", category: "En-têtes de sécurité", message: "X-Content-Type-Options manquant (MIME-sniffing possible)" });
    }
    if (headers.missingCount === 0) {
      findings.push({ severity: "low", category: "En-têtes de sécurité", message: "En-têtes de sécurité bien configurés" });
    }
  }

  return findings;
}

export async function POST(req: NextRequest) {
  try {
    const { domain } = (await req.json()) as { domain: string };

    if (!domain || !DOMAIN_RE.test(domain)) {
      return NextResponse.json({ error: "Domaine invalide" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rateLimit = await checkRateLimit(supabase, "attack_surface_reports", user.id, { windowMinutes: 60, max: 10 });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Too many scans. Please wait a bit before scanning again." },
        { status: 429 }
      );
    }

    const clientId = await getActiveClientId(supabase, user.id);
    if (!clientId) {
      return NextResponse.json({ error: "Select or create a client before scanning." }, { status: 400 });
    }

    // Run every scanner in parallel; each is self-contained and never throws
    // (they catch internally), so one failing check can't block the others.
    const [ssl, hibp, subdomains, dns, securityHeaders] = await Promise.all([
      checkSSL(domain),
      checkHIBP(domain),
      checkSubdomains(domain),
      checkDNS(domain),
      checkSecurityHeaders(domain),
    ]);

    const scoreBreakdown = computeScoreBreakdown(ssl, hibp, dns, securityHeaders);
    const riskScore = calculateRiskScore(scoreBreakdown);
    const recommendedPolicies = getRecommendedPolicies(ssl, hibp, dns);
    const findings = buildFindings(ssl, hibp, subdomains, dns, securityHeaders);

    const { data: report, error } = await supabase
      .from("attack_surface_reports")
      .insert({
        user_id: user.id,
        client_id: clientId,
        domain,
        risk_score: riskScore,
        score_breakdown: scoreBreakdown,
        ssl,
        emails_compromis: hibp,
        subdomains,
        dns,
        security_headers: securityHeaders,
        findings,
        recommended_policies: recommendedPolicies,
      })
      .select()
      .single();

    if (error) {
      console.error("Scan save error:", error);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    return NextResponse.json({ reportId: report.id, riskScore, scoreBreakdown, findings, recommendedPolicies });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
