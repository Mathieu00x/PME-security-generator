import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RemediationStatus } from "@/types";

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

  // Whitelist exactly these fields — never spread the raw body, which would
  // otherwise let a client overwrite snapshotted content (title_fr, control_code,
  // framework_mappings, etc.) that isn't meant to be editable through this route.
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "completed") updates.completed_at = new Date().toISOString();
    if (body.status === "verified") updates.verified_at = new Date().toISOString();
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
