import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Client, RemediationTask } from "@/types";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";

export default async function TaskDetailPage({ params }: { params: { id: string; taskId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (!client) notFound();

  // Scoped by both id AND the already-verified client_id — defense in depth
  // against a task belonging to one of the user's other clients rendering
  // under the wrong client's URL.
  const { data: task } = await supabase
    .from("remediation_tasks")
    .select("*")
    .eq("id", params.taskId)
    .eq("client_id", params.id)
    .single();

  if (!task) notFound();

  return <TaskDetailClient client={client as Client} task={task as RemediationTask} />;
}
