import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ComplianceFramework } from "@/types";

const FRAMEWORKS: ComplianceFramework[] = ["loi25", "pipeda"];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  const framework = req.nextUrl.searchParams.get("framework") as ComplianceFramework | null;
  if (!clientId || !framework || !FRAMEWORKS.includes(framework)) {
    return NextResponse.json({ error: "clientId and a valid framework are required" }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("user_id", user.id).single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: assessment } = await supabase
    .from("compliance_assessments")
    .select("*")
    .eq("client_id", clientId)
    .eq("framework", framework)
    .maybeSingle();

  // null is a valid "not started yet" state, not an error.
  return NextResponse.json({ assessment });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, framework } = (await req.json()) as { clientId: string; framework: ComplianceFramework };
  if (!clientId || !framework || !FRAMEWORKS.includes(framework)) {
    return NextResponse.json({ error: "clientId and a valid framework are required" }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("user_id", user.id).single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Get-or-create, idempotent on the (client_id, framework) unique index.
  const { data: existing } = await supabase
    .from("compliance_assessments")
    .select("*")
    .eq("client_id", clientId)
    .eq("framework", framework)
    .maybeSingle();
  if (existing) return NextResponse.json({ assessment: existing });

  const { data: created, error } = await supabase
    .from("compliance_assessments")
    .insert({ user_id: user.id, client_id: clientId, framework, answers: {}, status: "in_progress" })
    .select()
    .single();

  if (error) {
    console.error("assessments create error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }

  return NextResponse.json({ assessment: created });
}
