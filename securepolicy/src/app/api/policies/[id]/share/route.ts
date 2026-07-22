import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enabled } = (await req.json()) as { enabled: boolean };

  const { data: policy } = await supabase
    .from("policies")
    .select("id, share_token")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  const shareToken = policy.share_token || crypto.randomUUID();

  const { data: updated, error } = await supabase
    .from("policies")
    .update({ share_enabled: enabled, share_token: shareToken })
    .eq("id", params.id)
    .select("share_enabled, share_token")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update sharing settings" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
