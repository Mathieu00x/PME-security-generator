import { createClient } from "@/lib/supabase/server";
import { Client } from "@/types";
import { getEntitlements } from "@/lib/entitlements";
import { ClientsListClient } from "@/components/clients/ClientsListClient";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: clients }, entitlements] = await Promise.all([
    supabase.from("clients").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }),
    getEntitlements(supabase, user!.id),
  ]);

  return (
    <ClientsListClient
      initialClients={(clients as Client[]) || []}
      clientLimit={entitlements.clientLimit}
      planName={entitlements.plan?.name || null}
    />
  );
}
