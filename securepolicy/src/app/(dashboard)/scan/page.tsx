import { createClient } from "@/lib/supabase/server";
import { AttackSurfaceReport } from "@/types";
import { ScanForm } from "@/components/scan/ScanForm";
import { ScanReport } from "@/components/scan/ScanReport";
import { getActiveClientId } from "@/lib/activeClient";

export default async function ScanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const clientId = await getActiveClientId(supabase, user!.id);

  const { data: report } = clientId
    ? await supabase
        .from("attack_surface_reports")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (!report) {
    return <ScanForm />;
  }

  return <ScanReport report={report as AttackSurfaceReport} />;
}
