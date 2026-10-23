import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateComplianceScore } from "@/lib/assessments/scoring";
import { loi25Questions } from "@/lib/assessments/loi25-questions";
import { pipedaQuestions } from "@/lib/assessments/pipeda-questions";
import { AssessmentAnswer } from "@/types";

interface PatchBody {
  answers?: Record<string, AssessmentAnswer>;
  status?: "in_progress" | "completed";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const body = (await req.json()) as PatchBody;

  // Merge rather than replace — a PATCH from one section shouldn't clobber
  // answers from another section saved moments earlier.
  const mergedAnswers = body.answers ? { ...assessment.answers, ...body.answers } : assessment.answers;

  const questions = assessment.framework === "loi25" ? loi25Questions : pipedaQuestions;
  // Scores are always recomputed server-side from the merged answers — never
  // trust a client-submitted score.
  const { scores, overall } = calculateComplianceScore(mergedAnswers, questions);

  const updates: Record<string, unknown> = {
    answers: mergedAnswers,
    scores,
    overall_score: overall,
  };
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "completed") updates.completed_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from("compliance_assessments")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("assessments update error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }

  return NextResponse.json({ assessment: updated });
}
