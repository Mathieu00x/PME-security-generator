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
import { PolicyType } from "@/types";

const POLICY_TITLES: Record<PolicyType, string> = {
  password: "Password Policy",
  backup: "Backup and Data Recovery Policy",
  "incident-response": "Incident Response Plan",
  "acceptable-use": "Acceptable Use Policy",
  "remote-work": "Remote Work Security Policy",
};

export async function POST(req: NextRequest) {
  try {
    const { policyType, answers } = await req.json() as {
      policyType: PolicyType;
      answers: Record<string, string>;
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company profile
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const companyContext = profile
      ? buildCompanyContext(profile)
      : "Company Information\nCompany Name: [Not provided]\nIndustry: [Not provided]";

    const questionnaireContext = buildQuestionnaireContext(answers);
    const template = POLICY_TEMPLATES[policyType];

    const fullPrompt = [
      STYLE_PROMPT,
      "",
      companyContext,
      "",
      questionnaireContext,
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
          securityScore = {
            securityScore: parsed.securityScore,
            strengths: parsed.strengths || [],
            weaknesses: parsed.weaknesses || [],
            recommendations: parsed.recommendations || [],
            missingPolicies: parsed.missingPolicies || [],
            riskLevel: parsed.riskLevel || "Medium",
            complianceMapping: parsed.complianceMapping || {},
            bestPractices: parsed.bestPractices || null,
            actionItems: parsed.actionItems || [],
          };
        }
      } catch {
        console.warn("Failed to parse security score JSON");
      }
    }

    const title = POLICY_TITLES[policyType];

    // Save to DB
    const { data: policy, error } = await supabase
      .from("policies")
      .insert({
        user_id: user.id,
        title,
        type: policyType,
        content: documentContent,
        status: "completed",
        version: "1.0",
        security_score: securityScore,
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json({ error: "Failed to save policy" }, { status: 500 });
    }

    return NextResponse.json({ policyId: policy.id });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}