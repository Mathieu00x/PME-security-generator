import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRemediationAIContext } from "@/lib/remediationAiContext";
import { checkRateLimit } from "@/lib/rateLimit";
import { CompanyProfile, RemediationTask } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Same protection as /api/scan and /api/generate — this is the only other
  // route that calls Claude directly, and without a cap a client could loop
  // this endpoint across every task and run up the Anthropic bill.
  const rateLimit = await checkRateLimit(supabase, "ai_context_requests", user.id, { windowMinutes: 60, max: 20 });
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many AI context requests recently. Please wait a bit before trying again." },
      { status: 429 }
    );
  }

  const { lang } = (await req.json().catch(() => ({}))) as { lang?: "fr" | "en" };

  const { data: task } = await supabase
    .from("remediation_tasks")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Logged before the Anthropic call (not just on success) so a client can't
  // bypass the cap by retrying a failing/slow request past the window.
  const { error: logError } = await supabase.from("ai_context_requests").insert({ user_id: user.id });
  if (logError) console.error("ai-context: failed to log rate-limit usage", logError);

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("client_id", task.client_id)
    .maybeSingle();

  const context = await generateRemediationAIContext(
    task as RemediationTask,
    profile as CompanyProfile | null,
    lang ?? "fr"
  );

  if (!context) {
    return NextResponse.json({ error: "AI context generation failed. Please try again." }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("remediation_tasks")
    .update({ ai_context: context })
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("ai-context: failed to persist", updateError);
  }

  return NextResponse.json({ ai_context: context });
}
