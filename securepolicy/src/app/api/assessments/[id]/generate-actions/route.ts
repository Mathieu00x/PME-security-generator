import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loi25Questions } from "@/lib/assessments/loi25-questions";
import { pipedaQuestions } from "@/lib/assessments/pipeda-questions";
import { AssessmentAnswer, FrameworkMappings } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: assessment } = await supabase
    .from("compliance_assessments")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  const questions = assessment.framework === "loi25" ? loi25Questions : pipedaQuestions;
  const answers = assessment.answers as Record<string, AssessmentAnswer>;

  // Only confirmed gaps ("no" or "partial") become action items — "yes" needs
  // no action, "na" is explicitly exempted, unanswered questions are left for
  // the user to complete the questionnaire rather than silently assumed to be gaps.
  const gapQuestions = questions.sections
    .flatMap((s) => s.questions)
    .filter((q) => {
      const value = answers[q.id]?.value;
      return value === "no" || value === "partial";
    });

  if (gapQuestions.length === 0) {
    return NextResponse.json({ createdCount: 0 });
  }

  const rows = gapQuestions.map((q) => {
    const framework_mappings: FrameworkMappings = {
      nist_csf: [],
      cis_controls: [],
      iso_27001: [],
      loi_25: assessment.framework === "loi25" ? q.kb_references : [],
      pipeda: assessment.framework === "pipeda" ? q.kb_references : [],
      soc2: [],
    };
    return {
      user_id: user.id,
      client_id: assessment.client_id,
      source: "assessment",
      source_question_id: `${assessment.framework}:${q.id}`,
      category: "governance",
      severity: q.severity,
      phase: q.phase,
      title_fr: q.text_fr,
      title_en: q.text_en,
      why_it_matters_fr: q.help_fr,
      why_it_matters_en: q.help_en,
      framework_mappings,
    };
  });

  const { data: inserted, error } = await supabase
    .from("remediation_tasks")
    .upsert(rows, { onConflict: "client_id,source_question_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("generate-actions: insert failed", error);
    return NextResponse.json({ error: "Failed to generate actions" }, { status: 500 });
  }

  return NextResponse.json({ createdCount: inserted?.length ?? 0 });
}
