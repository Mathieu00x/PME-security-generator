import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExecutiveReport } from "@/lib/executiveReport";
import { AttackSurfaceReport, CompanyProfile, ComplianceAssessment } from "@/types";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, scanId, includeCompliance } = (await req.json()) as {
    clientId: string;
    scanId: string;
    includeCompliance?: boolean;
  };
  if (!clientId || !scanId) {
    return NextResponse.json({ error: "clientId and scanId are required" }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("id, name").eq("id", clientId).eq("user_id", user.id).single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: scan } = await supabase
    .from("attack_surface_reports")
    .select("*")
    .eq("id", scanId)
    .eq("client_id", clientId)
    .single();
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

  const [{ data: profile }, { data: loi25 }, { data: pipeda }] = await Promise.all([
    supabase.from("company_profiles").select("*").eq("client_id", clientId).maybeSingle(),
    includeCompliance
      ? supabase.from("compliance_assessments").select("*").eq("client_id", clientId).eq("framework", "loi25").maybeSingle()
      : Promise.resolve({ data: null }),
    includeCompliance
      ? supabase.from("compliance_assessments").select("*").eq("client_id", clientId).eq("framework", "pipeda").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const markdown = await generateExecutiveReport({
    companyName: client.name,
    province: (profile as CompanyProfile | null)?.province ?? null,
    industry: (profile as CompanyProfile | null)?.industry ?? null,
    scan: scan as AttackSurfaceReport,
    loi25: loi25 as ComplianceAssessment | null,
    pipeda: pipeda as ComplianceAssessment | null,
    includeCompliance: !!includeCompliance,
  });

  if (!markdown) {
    return NextResponse.json({ error: "Failed to generate the report. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ markdown, generatedAt: new Date().toISOString() });
}
