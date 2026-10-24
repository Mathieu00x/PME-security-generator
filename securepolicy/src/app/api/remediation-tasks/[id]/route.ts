import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RemediationStatus } from "@/types";

// "verified" is deliberately excluded here — it must never be self-reported.
// It's set only by the system: generateRemediationTasks() after a rescan no
// longer detects the finding (scan-sourced tasks), or the assessment PATCH
// route after the source question is re-answered "yes" (assessment-sourced
// tasks). See the review discussion that led to this: "completed" means a
// technician claims it's fixed; "verified" means SecurePilot confirmed it.
type ManualStatus = Exclude<RemediationStatus, "verified">;
const MANUAL_STATUSES: ManualStatus[] = ["open", "in_progress", "completed"];

interface PatchBody {
  status?: RemediationStatus;
  owner_name?: string | null;
  owner_email?: string | null;
  due_date?: string | null;
  evidence_notes?: string | null;
  evidence_url?: string | null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as PatchBody;

  if (body.status !== undefined && !MANUAL_STATUSES.includes(body.status as ManualStatus)) {
    return NextResponse.json(
      { error: "Status 'verified' cannot be set manually — it is confirmed automatically by SecurePilot." },
      { status: 400 }
    );
  }

  // Whitelist exactly these fields — never spread the raw body, which would
  // otherwise let a client overwrite snapshotted content (title_fr, control_code,
  // framework_mappings, etc.) that isn't meant to be editable through this route.
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "completed") updates.completed_at = new Date().toISOString();
  }
  if (body.owner_name !== undefined) updates.owner_name = body.owner_name;
  if (body.owner_email !== undefined) updates.owner_email = body.owner_email;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.evidence_notes !== undefined) updates.evidence_notes = body.evidence_notes;
  if (body.evidence_url !== undefined) updates.evidence_url = body.evidence_url;

  const { data: task, error } = await supabase
    .from("remediation_tasks")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
