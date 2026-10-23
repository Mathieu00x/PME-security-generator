import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Client, RemediationTask } from "@/types";
import { TasksClient } from "@/components/tasks/TasksClient";

export default async function TasksPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (!client) notFound();

  const [{ data: tasks }, { count: scanCount }] = await Promise.all([
    supabase
      .from("remediation_tasks")
      .select("*")
      .eq("client_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("attack_surface_reports")
      .select("id", { count: "exact", head: true })
      .eq("client_id", params.id),
  ]);

  return (
    <TasksClient
      client={client as Client}
      tasks={(tasks as RemediationTask[]) ?? []}
      hasScans={(scanCount ?? 0) > 0}
    />
  );
}
