import { createClient } from "@/lib/supabase/server";
import { Policy } from "@/types";
import { PoliciesClient } from "@/components/policies/PoliciesClient";
import { getClientContext } from "@/lib/clientContext";
import { PoliciesPageHeader } from "@/components/policies/PoliciesPageHeader";

export default async function PoliciesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { clientId, branding } = await getClientContext(supabase, user!.id);

  const { data: policies } = clientId
    ? await supabase
        .from("policies")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-5xl mx-auto">
      <PoliciesPageHeader />
      <PoliciesClient initialPolicies={(policies as Policy[]) || []} branding={branding} />
    </div>
  );
}
