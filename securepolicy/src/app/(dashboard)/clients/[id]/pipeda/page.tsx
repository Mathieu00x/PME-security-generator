import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Client, ComplianceAssessment } from "@/types";
import { pipedaQuestions } from "@/lib/assessments/pipeda-questions";
import { AssessmentClient } from "@/components/assessments/AssessmentClient";

export default async function PipedaPage({ params }: { params: { id: string } }) {
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
    .eq("framework", "pipeda")
    .maybeSingle();

  if (!assessment) {
    const { data: created } = await supabase
      .from("compliance_assessments")
      .insert({ user_id: user!.id, client_id: params.id, framework: "pipeda", answers: {}, status: "in_progress" })
      .select()
      .single();
    assessment = created;
  }

  return (
    <AssessmentClient
      client={client as Client}
      assessment={assessment as ComplianceAssessment}
      questions={pipedaQuestions}
    />
  );
}
