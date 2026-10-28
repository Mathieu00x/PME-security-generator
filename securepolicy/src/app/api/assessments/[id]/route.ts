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
  const questions = assessment.framework === "loi25" ? loi25Questions : pipedaQuestions;
  const allQuestionIds = questions.sections.flatMap((s) => s.questions.map((q) => q.id));

  // A completed assessment is locked: no answer change is accepted — not a
  // plain autosave, and not one bundled with a reopen request in the same
  // call — until it's explicitly reopened (status: "in_progress") on its
  // own, with no answers in that same request. This is enforced here, not
  // just by disabling inputs client-side, so a direct API call can't bypass
  // it. Nothing is written for a rejected request.
  if (assessment.status === "completed" && body.answers) {
    return NextResponse.json(
      { error: "This assessment is completed. Reopen it before changing answers." },
      { status: 409 }
    );
  }

  // Completion is validated BEFORE any write — atomic in the sense that a
  // rejected attempt leaves answers/scores/status exactly as they were.
  // Checked against a JS-side preview merge (existing answers + this
  // request's answers), not yet persisted, so a request that both answers
  // a question and asks to complete in the same call is evaluated fairly
  // without writing anything if it's rejected. The actual persisted merge
  // below still goes through the atomic DB-side RPC once this passes.
  if (body.status === "completed") {
    const previewAnswers = { ...assessment.answers, ...(body.answers ?? {}) };
    const missingQuestionIds = allQuestionIds.filter((qid) => !previewAnswers?.[qid]?.value);
    if (missingQuestionIds.length > 0) {
      return NextResponse.json(
        { error: "Cannot complete: some questions are unanswered", missingQuestionIds },
        { status: 409 }
      );
    }
  }

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
    if (body.status === "completed") {
      // The missing-answers case already returned above — reaching here
      // means every question is answered.
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    } else {
      // Reopening: answers and scores are untouched above, just the status
      // (and the stale completed_at, which is no longer true) move back.
      updates.status = body.status;
      updates.completed_at = null;
    }
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
