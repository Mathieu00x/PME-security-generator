import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  SYSTEM_PROMPT,
  STYLE_PROMPT,
  buildCompanyContext,
  buildQuestionnaireContext,
  POLICY_TEMPLATES,
  JSON_OUTPUT_PROMPT,
} from "@/lib/prompts";
import { ArtifactType, AttackSurfaceReport, PolicyType } from "@/types";
import { getEntitlements } from "@/lib/entitlements";
import { getActiveClientId } from "@/lib/activeClient";
import { checkRateLimit } from "@/lib/rateLimit";

const VALID_ARTIFACT_TYPES: ArtifactType[] = [
  "backup_register",
  "asset_inventory",
  "training_register",
  "incident_register",
  "access_register",
  "rights_request_register",
  "third_party_register",
];

const POLICY_TITLES: Record<PolicyType, string> = {
  password: "Password Policy",
  backup: "Backup and Data Recovery Policy",
  "incident-response": "Incident Response Plan",
  "acceptable-use": "Acceptable Use Policy",
  "remote-work": "Remote Work Security Policy",
};

export async function POST(req: NextRequest) {
  try {
    const { policyType, answers, generationReason, policyId, scanId } = await req.json() as {
      policyType: PolicyType;
      answers: Record<string, string>;
      generationReason?: string;
      policyId?: string;
      scanId?: string;
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entitlements = await getEntitlements(supabase, user.id);
    if (!entitlements.subscription) {
      return NextResponse.json({ error: "Choose a plan before generating policies." }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(supabase, "policy_versions", user.id, {
      windowMinutes: 60,
      max: 20,
      userColumn: "created_by",
    });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Too many policies generated recently. Please wait a bit before generating another." },
        { status: 429 }
      );
    }

    // If regenerating, fetch and verify ownership of the existing policy.
    // Regeneration (creating a new version of an existing policy) is a
    // Pro+ "versioning" feature.
    let existingPolicy: { id: string; version_number: number; framework_versions: Record<string, string> | null; client_id: string | null } | null = null;
    if (policyId) {
      if (!entitlements.hasFeature("versioning")) {
        return NextResponse.json({ error: "Regenerating policies requires the Pro plan or higher." }, { status: 403 });
      }

      const { data: existing } = await supabase
        .from("policies")
        .select("id, version_number, framework_versions, client_id")
        .eq("id", policyId)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 });
      }
      existingPolicy = existing;
    }

    const clientId = existingPolicy?.client_id ?? (await getActiveClientId(supabase, user.id));
    if (!clientId) {
      return NextResponse.json({ error: "Select or create a client before generating a policy." }, { status: 400 });
    }

    // Get company profile
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    const { data: frameworks } = await supabase.from("frameworks").select("id, current_version");
    const frameworkVersionMap: Record<string, string> = {};
    (frameworks || []).forEach((f) => { frameworkVersionMap[f.id] = f.current_version; });

    // If a regenerated policy was generated against an outdated framework
    // revision, tell the model so it can align the new draft accordingly.
    let frameworkUpdateNote = "";
    if (existingPolicy?.framework_versions) {
      const outdated = Object.entries(existingPolicy.framework_versions)
        .filter(([key, oldVersion]) => frameworkVersionMap[key] && frameworkVersionMap[key] !== oldVersion)
        .map(([key, oldVersion]) => `${key} (was ${oldVersion}, now ${frameworkVersionMap[key]})`);

      if (outdated.length) {
        frameworkUpdateNote = `\nFramework Update Notice\nThis policy was last generated against an older framework revision. Align the updated document with the current revision of: ${outdated.join(", ")}.`;
      }
    }

    // If this generation was launched from an attack-surface scan, ground
    // the policy in the real findings rather than just questionnaire answers.
    let scanContext = "";
    if (scanId) {
      const { data: scanReport } = await supabase
        .from("attack_surface_reports")
        .select("*")
        .eq("id", scanId)
        .eq("user_id", user.id)
        .single();

      if (scanReport) {
        const scan = scanReport as AttackSurfaceReport;
        scanContext = `
DONNÉES DE SCAN RÉEL (priorité haute)
- Domaine analysé : ${scan.domain}
- Score de risque : ${scan.risk_score}/100
- Emails compromis : ${scan.emails_compromis.compromisedCount}
- SSL : ${scan.ssl.grade ?? (scan.ssl.hasSSL ? "Configuré, grade inconnu" : "Non configuré")}
- SPF : ${scan.dns.hasSPF ? "Configuré" : "Manquant"}
- DMARC : ${scan.dns.hasDMARC ? "Configuré" : "Manquant"}
- Sous-domaines exposés : ${scan.subdomains.count}
Génère une politique qui adresse directement ces vulnérabilités détectées.`;
      }
    }

    const companyContext = profile
      ? buildCompanyContext(profile)
      : "Company Information\nCompany Name: [Not provided]\nIndustry: [Not provided]";

    const questionnaireContext = buildQuestionnaireContext(answers, generationReason);
    const template = POLICY_TEMPLATES[policyType];

    const fullPrompt = [
      STYLE_PROMPT,
      "",
      companyContext,
      "",
      questionnaireContext,
      frameworkUpdateNote,
      scanContext,
      "",
      template,
      JSON_OUTPUT_PROMPT,
    ].join("\n");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: fullPrompt }],
    });

    const rawContent = message.content[0].type === "text" ? message.content[0].text : "";

    // Split document from JSON
    const jsonSplit = rawContent.split("---JSON---");
    const documentContent = jsonSplit[0].trim();
    let securityScore = null;

    if (jsonSplit[1]) {
      try {
        const jsonMatch = jsonSplit[1].match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          // Defensive: the model may occasionally return recommendations as
          // plain strings instead of { priority, text } objects.
          const recommendations = (parsed.recommendations || []).map(
            (r: unknown) =>
              typeof r === "string" ? { priority: "medium", text: r } : r
          );

          // Defensive: only keep audit evidence entries referencing a
          // register type that actually exists in the product.
          const auditEvidence = (parsed.auditEvidence || []).filter(
            (e: { type?: string }) => VALID_ARTIFACT_TYPES.includes(e?.type as ArtifactType)
          );

          securityScore = {
            securityScore: parsed.securityScore,
            maturityLevel: parsed.maturityLevel || parsed.documentInfo?.estimatedSecurityMaturity || null,
            executiveSummary: parsed.executiveSummary || null,
            strengths: parsed.strengths || [],
            weaknesses: parsed.weaknesses || [],
            recommendations,
            missingPolicies: parsed.missingPolicies || [],
            riskLevel: parsed.riskLevel || "Medium",
            complianceMapping: parsed.complianceMapping || {},
            gapAnalysis: parsed.gapAnalysis || null,
            auditEvidence,
            bestPractices: parsed.bestPractices || null,
            actionItems: parsed.actionItems || [],
            policyImportance: parsed.policyImportance || null,
          };
        }
      } catch {
        console.warn("Failed to parse security score JSON");
      }
    }

    const title = POLICY_TITLES[policyType];
    const newVersionNumber = existingPolicy ? existingPolicy.version_number + 1 : 1;

    // Snapshot the current framework versions this policy was aligned with
    const frameworkVersions: Record<string, string> = {};
    Object.keys(securityScore?.complianceMapping || {}).forEach((key) => {
      if (frameworkVersionMap[key]) frameworkVersions[key] = frameworkVersionMap[key];
    });

    let policy;
    if (existingPolicy) {
      // Regeneration: update the policy in place and append a new version to the ledger
      const { data: updated, error } = await supabase
        .from("policies")
        .update({
          title,
          type: policyType,
          content: documentContent,
          version: `${newVersionNumber}.0`,
          version_number: newVersionNumber,
          answers,
          generation_reason: generationReason,
          security_score: securityScore,
          framework_versions: frameworkVersions,
        })
        .eq("id", existingPolicy.id)
        .select()
        .single();

      if (error) {
        console.error("DB error:", error);
        return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
      }
      policy = updated;
    } else {
      // First generation
      const { data: inserted, error } = await supabase
        .from("policies")
        .insert({
          user_id: user.id,
          client_id: clientId,
          title,
          type: policyType,
          content: documentContent,
          status: "completed",
          version: "1.0",
          version_number: 1,
          answers,
          generation_reason: generationReason,
          security_score: securityScore,
          framework_versions: frameworkVersions,
        })
        .select()
        .single();

      if (error) {
        console.error("DB error:", error);
        return NextResponse.json({ error: "Failed to save policy" }, { status: 500 });
      }
      policy = inserted;
    }

    // Append to the version ledger (append-only, never mutated)
    const { error: versionError } = await supabase.from("policy_versions").insert({
      policy_id: policy.id,
      version_number: newVersionNumber,
      title,
      content: documentContent,
      security_score: securityScore,
      answers,
      generation_reason: generationReason,
      framework_versions: frameworkVersions,
      change_type: existingPolicy ? "regenerated" : "generated",
      created_by: user.id,
    });

    if (versionError) {
      console.error("Version ledger error:", versionError);
    }

    return NextResponse.json({ policyId: policy.id });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}