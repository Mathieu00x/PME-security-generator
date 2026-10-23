import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttackSurfaceReport, Client, RemediationTask } from "@/types";
import { RoadmapClient } from "@/components/roadmap/RoadmapClient";

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();
  if (!client) notFound();

  const [{ data: tasks }, { data: latestScan }] = await Promise.all([
    supabase.from("remediation_tasks").select("*").eq("client_id", params.id).order("phase"),
    supabase
      .from("attack_surface_reports")
      .select("*")
      .eq("client_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <RoadmapClient
      client={client as Client}
      tasks={(tasks as RemediationTask[]) ?? []}
      latestScan={latestScan as AttackSurfaceReport | null}
    />
  );
}
