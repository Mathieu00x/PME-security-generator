import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Client, ComplianceAssessment, ComplianceRequirement } from "@/types";
import { loi25Questions } from "@/lib/assessments/loi25-questions";
import { AssessmentClient } from "@/components/assessments/AssessmentClient";

export default async function Loi25Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();
  if (!client) notFound();

  let { data: assessment } = await supabase
    .from("compliance_assessments")
    .select("*")
    .eq("client_id", params.id)
    .eq("framework", "loi25")
    .maybeSingle();

  if (!assessment) {
    const { data: created } = await supabase
      .from("compliance_assessments")
      .insert({ user_id: user!.id, client_id: params.id, framework: "loi25", answers: {}, status: "in_progress" })
      .select()
      .single();
    assessment = created;
  }

  const { data: requirementRows } = await supabase
    .from("compliance_requirement")
    .select("*")
    .eq("framework", "loi25");
  const requirements = Object.fromEntries(
    ((requirementRows as ComplianceRequirement[]) ?? []).map((r) => [r.requirement_key, r])
  );

  return (
    <AssessmentClient
      client={client as Client}
      assessment={assessment as ComplianceAssessment}
      questions={loi25Questions}
      requirements={requirements}
    />
  );
}
