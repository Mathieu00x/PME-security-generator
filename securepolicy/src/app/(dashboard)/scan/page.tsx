import { createClient } from "@/lib/supabase/server";
import { AttackSurfaceReport } from "@/types";
import { ScanForm } from "@/components/scan/ScanForm";
import { ScanReport } from "@/components/scan/ScanReport";

export default async function ScanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: report } = await supabase
    .from("attack_surface_reports")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!report) {
    return <ScanForm />;
  }

  return <ScanReport report={report as AttackSurfaceReport} />;
}
