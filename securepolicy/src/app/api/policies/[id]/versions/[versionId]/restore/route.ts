import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: policy } = await supabase
    .from("policies")
    .select("id, version_number")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  const { data: targetVersion } = await supabase
    .from("policy_versions")
    .select("*")
    .eq("id", params.versionId)
    .eq("policy_id", params.id)
    .single();

  if (!targetVersion) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const newVersionNumber = policy.version_number + 1;

  const { error: updateError } = await supabase
    .from("policies")
    .update({
      title: targetVersion.title,
      content: targetVersion.content,
      security_score: targetVersion.security_score,
      answers: targetVersion.answers,
      generation_reason: targetVersion.generation_reason,
      framework_versions: targetVersion.framework_versions,
      version: `${newVersionNumber}.0`,
      version_number: newVersionNumber,
    })
    .eq("id", params.id);

  if (updateError) {
    console.error("Restore error:", updateError);
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
  }

  const { error: versionError } = await supabase.from("policy_versions").insert({
    policy_id: params.id,
    version_number: newVersionNumber,
    title: targetVersion.title,
    content: targetVersion.content,
    security_score: targetVersion.security_score,
    answers: targetVersion.answers,
    generation_reason: targetVersion.generation_reason,
    framework_versions: targetVersion.framework_versions,
    change_type: "restored",
    change_summary: `Restored from v${targetVersion.version_number}`,
    created_by: user.id,
  });

  if (versionError) {
    console.error("Version ledger error:", versionError);
  }

  return NextResponse.json({ success: true, versionNumber: newVersionNumber });
}
