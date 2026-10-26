import { createClient } from "@/lib/supabase/server";
import { AttackSurfaceReport } from "@/types";
import { ScanForm } from "@/components/scan/ScanForm";
import { ScanReport } from "@/components/scan/ScanReport";
import { getActiveClientId } from "@/lib/activeClient";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: { domain?: string; autorun?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const clientId = await getActiveClientId(supabase, user!.id);

  const [{ data: report }, { count: scanCount }] = await Promise.all([
    clientId
      ? supabase
          .from("attack_surface_reports")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? supabase.from("attack_surface_reports").select("id", { count: "exact", head: true }).eq("client_id", clientId)
      : Promise.resolve({ count: 0 }),
  ]);

  if (!report) {
    return <ScanForm initialDomain={searchParams.domain} autoSubmit={searchParams.autorun === "1"} />;
  }

  return <ScanReport report={report as AttackSurfaceReport} isFirstScan={scanCount === 1} />;
}
