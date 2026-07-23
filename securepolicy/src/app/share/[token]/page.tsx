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
    .select("id, user_id, title, content, version, updated_at, security_score")
    .eq("share_token", params.token)
    .eq("share_enabled", true)
    .single();

  if (!policy) notFound();

  const p = policy as Pick<Policy, "id" | "user_id" | "title" | "content" | "version" | "updated_at" | "security_score">;

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

  // Only forward the fields the public view actually renders — never leak
  // internal fields like questionnaire answers, generation_reason, or client_id
  // into the client-rendered RSC payload.
  const sharedPolicy = {
    title: p.title,
    content: p.content,
    version: p.version,
    updated_at: p.updated_at,
    security_score: p.security_score,
  };

  return <SharedPolicyView policy={sharedPolicy} whiteLabel={whiteLabel} brandName={brandName} />;
}
