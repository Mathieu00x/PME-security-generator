import Anthropic from "@anthropic-ai/sdk";
import { AttackSurfaceReport, CompanyProfile, ComplianceAssessment } from "@/types";

// Score categories can be null when the underlying check errored (HIBP is the
// norm, not the exception, in production — see ScoreBreakdown's own docs).
// Must render as "not evaluated", never silently coerced to 0/25.
function scoreLine(label: string, value: number | null): string {
  return value === null ? `${label} : non évalué` : `${label} : ${value}/25`;
}

function buildComplianceSection(
  loi25: ComplianceAssessment | null,
  pipeda: ComplianceAssessment | null
): string {
  const lines: string[] = [];
  if (loi25) {
    lines.push(`Indice de préparation — Loi 25 : ${loi25.overall_score ?? 0}% (${loi25.status === "completed" ? "évaluation complétée" : "en cours"})`);
  }
  if (pipeda) {
    lines.push(`Indice de préparation — PIPEDA : ${pipeda.overall_score ?? 0}% (${pipeda.status === "completed" ? "évaluation complétée" : "en cours"})`);
  }
  if (lines.length === 0) {
    return "Aucune évaluation de préparation (Loi 25 / PIPEDA) n'a encore été réalisée pour ce client. Recommander de la compléter.";
  }
  return lines.join("\n");
}

export interface ExecutiveReportParams {
  companyName: string;
  province: string | null;
  industry: string | null;
  scan: AttackSurfaceReport;
  loi25: ComplianceAssessment | null;
  pipeda: ComplianceAssessment | null;
  includeCompliance: boolean;
}

// Unlike generateExecutiveSummary() in scan/route.ts (silent background
// enrichment embedded in the scan report), this is the main deliverable of
// POST /api/reports/executive — triggered by an explicit user click. A null
// return here must become a real HTTP error at the call site, not a silently
// missing report.
export async function generateExecutiveReport(params: ExecutiveReportParams): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const { companyName, province, industry, scan, loi25, pipeda, includeCompliance } = params;
  const breakdown = scan.score_breakdown;

  const criticalFindings = scan.findings.filter((f) => f.severity === "high").map((f) => f.message);
  const otherFindings = scan.findings.filter((f) => f.severity === "medium").map((f) => f.message);

  const complianceSection = includeCompliance ? buildComplianceSection(loi25, pipeda) : "Non demandé dans ce rapport.";

  const prompt = `Tu es un expert en cybersécurité et conformité au Canada. Tu prépares un rapport exécutif pour le dirigeant d'une PME canadienne.

Contexte du client :
- Entreprise : ${companyName}
- Domaine : ${scan.domain}
- Province : ${province ?? "Non spécifiée"}
- Secteur : ${industry ?? "Non spécifié"}

Résultats du scan de posture de sécurité externe :
- Score global : ${scan.risk_score}/100
${breakdown ? scoreLine("SSL/TLS", breakdown.ssl) : "SSL/TLS : non disponible"}
${breakdown ? scoreLine("Email (SPF/DMARC/DKIM)", breakdown.dnsEmail) : "Email : non disponible"}
${breakdown ? scoreLine("Exposition (HIBP)", breakdown.dataExposure) : "Exposition : non disponible"}
${breakdown ? scoreLine("En-têtes HTTP", breakdown.headers) : "En-têtes : non disponible"}
- Findings critiques : ${criticalFindings.join(", ") || "Aucun"}
- Findings élevés : ${otherFindings.join(", ") || "Aucun"}

Indice de préparation réglementaire (PAS un score de conformité ni une certification — mesure le niveau de préparation selon les contrôles évalués par SecurePilot) :
${complianceSection}

Génère un rapport exécutif EN FRANÇAIS avec cette structure exacte :

# Rapport de posture de sécurité — ${companyName}
*Préparé le ${new Date().toLocaleDateString("fr-CA")}*

## Synthèse

[2-3 phrases résumant la posture globale et l'urgence d'action pour un dirigeant non-technique]

## Score de posture de sécurité externe

[Résumé du score et ce qu'il signifie en langage simple. Rappeler que ce score couvre les contrôles observables externalement, pas la sécurité interne. Si une catégorie est "non évaluée", l'expliquer honnêtement sans l'ignorer ni la présenter comme un problème.]

## Ce qui nécessite votre attention immédiate

[Max 3 points critiques, expliqués en langage business, sans jargon technique. Chaque point : risque concret pour l'entreprise + coût d'inaction]

## Prochaines étapes recommandées

[0-30 jours : actions immédiates]
[30-60 jours : consolidation]
[60-90 jours : maturité]

## Indice de préparation réglementaire

[Résumé du niveau de préparation à partir des données fournies ci-dessus, ou recommandation de compléter l'évaluation si aucune n'existe. Toujours appeler ça un "indice de préparation", jamais un "score de conformité" ou un pourcentage de conformité.]

---
*Ce rapport est basé sur une évaluation externe passive des contrôles de sécurité observables et sur l'auto-évaluation déclarée dans SecurePilot. Il ne constitue pas un test d'intrusion, un audit de conformité, ni un avis juridique. Consultez un professionnel qualifié pour toute validation réglementaire.*

Ton ton doit être professionnel, direct et orienté business. Évite le jargon technique. Le dirigeant comprend les risques business mais pas les protocoles réseau. Ne jamais inventer de statistique ou de détail qui ne figure pas dans les données fournies.

Contrainte de format stricte : n'utilise QUE des titres (#, ##), des paragraphes et des listes à puces (-). N'utilise JAMAIS de tableau markdown (pas de |), de code, ni de liste numérotée — le moteur de rendu de ce rapport (écran et export PDF) ne supporte que ces éléments de base et un tableau s'afficherait de façon cassée.`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    return text || null;
  } catch (err) {
    console.error("Executive report generation failed:", err);
    return null;
  }
}
