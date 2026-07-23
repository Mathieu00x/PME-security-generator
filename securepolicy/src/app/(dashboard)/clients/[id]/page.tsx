import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Client, CompanyProfile } from "@/types";
import { ClientProfileForm } from "@/components/clients/ClientProfileForm";

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (!client) notFound();

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("client_id", params.id)
    .maybeSingle();

  return (
    <ClientProfileForm
      client={client as Client}
      initialProfile={profile as CompanyProfile | null}
    />
  );
}
