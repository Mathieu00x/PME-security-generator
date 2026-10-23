import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttackSurfaceReport, Client } from "@/types";
import { ReportClient } from "@/components/reports/ReportClient";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();
  if (!client) notFound();

  const { data: latestScan } = await supabase
    .from("attack_surface_reports")
    .select("*")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <ReportClient client={client as Client} latestScan={latestScan as AttackSurfaceReport | null} />;
}
