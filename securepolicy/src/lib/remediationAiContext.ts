import Anthropic from "@anthropic-ai/sdk";
import { CompanyProfile, RemediationTask } from "@/types";

// Same resilience convention as generateExecutiveSummary() in scan/route.ts:
// best-effort, never throws, returns null on any failure. Unlike that function
// (silent background enrichment), the caller here is triggered by an explicit
// user click — the API route must translate a null result into a real HTTP
// error so the button's loading state doesn't silently do nothing.
export async function generateRemediationAIContext(
  task: RemediationTask,
  profile: CompanyProfile | null,
  lang: "fr" | "en" = "fr"
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt =
      lang === "fr"
        ? "Tu es un consultant en cybersécurité qui explique une action de remédiation à un dirigeant de PME non technique. " +
          "Règles strictes : maximum 3 phrases ; aucun jargon technique non expliqué ; ton direct, factuel et actionnable ; " +
          "personnalise en fonction du profil de l'entreprise fourni (secteur, taille, usage du cloud) sans jamais inventer " +
          "de détail qui ne figure pas dans les données fournies. Réponds uniquement avec le texte, sans préambule."
        : "You are a cybersecurity consultant explaining a remediation action to a non-technical SMB leader. " +
          "Strict rules: maximum 3 sentences; no unexplained technical jargon; direct, factual, actionable tone; " +
          "personalize based on the provided company profile (industry, size, cloud usage) without ever inventing " +
          "a detail not present in the provided data. Respond with only the text, no preamble.";

    const title = lang === "fr" ? task.title_fr : task.title_en;
    const why = lang === "fr" ? task.why_it_matters_fr : task.why_it_matters_en;
    const profileLines = profile
      ? `Secteur : ${profile.industry}\nTaille : ${profile.employee_count} employés\nServices cloud : ${profile.cloud_services}`
      : "Profil d'entreprise non renseigné.";

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Action de remédiation : ${title}\nPourquoi c'est important : ${why ?? "N/A"}\n\nProfil du client :\n${profileLines}`,
        },
      ],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    return text || null;
  } catch (err) {
    console.error("Remediation AI context generation failed:", err);
    return null;
  }
}
