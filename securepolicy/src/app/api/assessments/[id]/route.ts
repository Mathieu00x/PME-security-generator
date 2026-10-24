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

  // Merge happens atomically in Postgres (answers || new_answers in a single
  // UPDATE statement), not by reading assessment.answers here and writing it
  // back in JS. Two autosaves that overlap (debounce window raced by a slow
  // request) used to be a classic lost-update: both read the same snapshot,
  // whichever wrote last silently discarded the other's answer. The DB-side
  // merge serializes on the row lock instead, so neither write is lost.
  let mergedAnswers = assessment.answers;
  if (body.answers) {
    const { data: merged, error: mergeError } = await supabase.rpc("merge_assessment_answers", {
      p_id: params.id,
      p_user_id: user.id,
      p_new_answers: body.answers,
    });
    if (mergeError || !merged) {
      console.error("assessments merge error:", mergeError);
      return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
    }
    mergedAnswers = merged.answers;
  }

  const questions = assessment.framework === "loi25" ? loi25Questions : pipedaQuestions;
  // Scores are always recomputed server-side from the merged answers — never
  // trust a client-submitted score. Computed from the just-merged snapshot, so
  // in the rare case of a concurrent overlapping save, this update's score
  // write reflects a snapshot that's at most one answer stale — never a lost
  // answer, since the answers column itself was never touched by this write.
  const { scores, overall } = calculateComplianceScore(mergedAnswers, questions);

  const updates: Record<string, unknown> = {
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

  // A gap closing ("no"/"partial" -> "yes") on a question that already has a
  // corresponding remediation task is real evidence, same spirit as the
  // scan-side reconciliation in verifyResolvedScanTasks(): there's no
  // "rescan" for a compliance question, the updated answer itself is the
  // proof. One-way, same as the scan side — reverting the answer later does
  // not auto-reopen the task.
  if (body.answers) {
    const resolvedQuestionIds = Object.entries(body.answers)
      .filter(([, answer]) => answer.value === "yes")
      .map(([questionId]) => `${assessment.framework}:${questionId}`);

    if (resolvedQuestionIds.length > 0) {
      const { error: verifyError } = await supabase
        .from("remediation_tasks")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("client_id", assessment.client_id)
        .eq("source", "assessment")
        .in("source_question_id", resolvedQuestionIds)
        .in("status", ["open", "in_progress", "completed"]);
      if (verifyError) console.error("assessments: task verification failed", verifyError);
    }
  }

  return NextResponse.json({ assessment: updated });
}
