import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSSL, SSLResult } from "@/lib/scanners/ssl";
import { checkHIBP, HIBPResult } from "@/lib/scanners/hibp";
import { checkSubdomains, SubdomainsResult } from "@/lib/scanners/subdomains";
import { checkDNS, DNSResult } from "@/lib/scanners/dns";
import { PolicyType, ScanFinding } from "@/types";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;

function calculateRiskScore(ssl: SSLResult, hibp: HIBPResult, dns: DNSResult): number {
  let score = 100;

  if (!ssl.hasSSL) score -= 25;
  else if (ssl.expired) score -= 20;
  else if (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry < 30) score -= 10;
  else if (ssl.grade && ["C", "D", "E", "F"].includes(ssl.grade)) score -= 15;

  if (hibp.compromisedCount > 10) score -= 25;
  else if (hibp.compromisedCount > 3) score -= 15;
  else if (hibp.compromisedCount > 0) score -= 8;

  if (!dns.hasSPF) score -= 10;
  if (!dns.hasDMARC) score -= 10;
  if (!dns.hasMX) score -= 5;

  return Math.max(0, score);
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
  if (!dns.hasSPF || !dns.hasDMARC) {
    policies.push("acceptable-use");
  }
  if (!policies.includes("backup")) policies.push("backup");

  return Array.from(new Set(policies));
}

function buildFindings(ssl: SSLResult, hibp: HIBPResult, subdomains: SubdomainsResult, dns: DNSResult): ScanFinding[] {
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
  if (dns.hasSPF && dns.hasDMARC) {
    findings.push({ severity: "low", category: "DNS", message: "SPF et DMARC correctement configurés" });
  }

  findings.push({
    severity: "low",
    category: "Sous-domaines",
    message: `${subdomains.count} sous-domaine(s) exposé(s) détecté(s)`,
  });

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

    // Run every scanner in parallel; each is self-contained and never throws
    // (they catch internally), so one failing check can't block the others.
    const [ssl, hibp, subdomains, dns] = await Promise.all([
      checkSSL(domain),
      checkHIBP(domain),
      checkSubdomains(domain),
      checkDNS(domain),
    ]);

    const riskScore = calculateRiskScore(ssl, hibp, dns);
    const recommendedPolicies = getRecommendedPolicies(ssl, hibp, dns);
    const findings = buildFindings(ssl, hibp, subdomains, dns);

    const { data: report, error } = await supabase
      .from("attack_surface_reports")
      .insert({
        user_id: user.id,
        domain,
        risk_score: riskScore,
        ssl,
        emails_compromis: hibp,
        subdomains,
        dns,
        findings,
        recommended_policies: recommendedPolicies,
      })
      .select()
      .single();

    if (error) {
      console.error("Scan save error:", error);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    return NextResponse.json({ reportId: report.id, riskScore, findings, recommendedPolicies });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
