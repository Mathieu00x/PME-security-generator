import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Policy } from "@/types";
import { getEntitlements } from "@/lib/entitlements";
import { resolveBranding } from "@/lib/branding";
import { SharedPolicyView } from "@/components/policies/SharedPolicyView";

export default async function SharedPolicyPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();

  const { data: policy } = await supabase
    .from("policies")
    .select("*")
    .eq("share_token", params.token)
    .eq("share_enabled", true)
    .single();

  if (!policy) notFound();

  const p = policy as Policy;

  // White-label (Agency plan): hide the SecurePilot wordmark and footer,
  // showing the owning account's own brand instead.
  const entitlements = await getEntitlements(supabase, p.user_id);
  const whiteLabel = entitlements.hasFeature("white_label");
  let brandName: string | null = null;
  if (whiteLabel) {
    const { data: accountSettings } = await supabase
      .from("account_settings")
      .select("*")
      .eq("user_id", p.user_id)
      .maybeSingle();
    brandName = resolveBranding(accountSettings, true).name;
  }

  return <SharedPolicyView policy={p} whiteLabel={whiteLabel} brandName={brandName} />;
}
