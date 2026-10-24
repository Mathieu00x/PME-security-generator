import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loi25Questions } from "@/lib/assessments/loi25-questions";
import { pipedaQuestions } from "@/lib/assessments/pipeda-questions";
import { AssessmentQuestionnaire } from "@/lib/assessments/loi25-questions";
import { ComplianceFramework } from "@/types";

// Official regulator sites, not deep links to specific articles — source_url
// points to the body with jurisdiction over the framework, never a citation
// we haven't had reviewed. source_reference reuses kb_references, already
// written when the question was authored; it is NOT a verified legal
// citation, which is exactly why review_status defaults to "pending_review".
const FRAMEWORK_SOURCE_URL: Record<ComplianceFramework, string> = {
  loi25: "https://www.cai.gouv.qc.ca/",
  pipeda: "https://www.priv.gc.ca/",
};

function buildRows(questions: AssessmentQuestionnaire) {
  return questions.sections.flatMap((section) =>
    section.questions.map((q) => ({
      framework: questions.framework,
      requirement_key: `${questions.framework}:${q.id}`,
      title_fr: q.text_fr,
      title_en: q.text_en,
      description_fr: q.help_fr,
      description_en: q.help_en,
      source_reference: q.kb_references.length > 0 ? q.kb_references.join(", ") : null,
      source_url: FRAMEWORK_SOURCE_URL[questions.framework],
      weight: section.weight,
    }))
  );
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.ADMIN_SECRET_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "Admin endpoint not configured" }, { status: 503 });
  }

  const token = req.headers.get("x-admin-token");
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = [...buildRows(loi25Questions), ...buildRows(pipedaQuestions)];

  const supabase = createAdminClient();
  // onConflict on requirement_key only — review_status/last_reviewed_at/
  // reviewed_by are deliberately NOT in `rows`, so a re-seed (content edits)
  // never clobbers a review that already happened.
  const { error } = await supabase.from("compliance_requirement").upsert(rows, { onConflict: "requirement_key" });

  if (error) {
    console.error("seed-compliance-requirements: upsert failed", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }

  return NextResponse.json({ seeded: rows.length });
}
