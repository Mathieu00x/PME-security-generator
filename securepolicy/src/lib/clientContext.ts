import { getActiveClientId } from "@/lib/activeClient";
import { getEntitlements, Entitlements } from "@/lib/entitlements";
import { resolveBranding } from "@/lib/branding";
import { Branding, CompanyProfile } from "@/types";

export interface ClientContext {
  clientId: string | null;
  profile: CompanyProfile | null;
  companyName: string;
  branding: Branding;
  entitlements: Entitlements;
}

// Bundles everything most dashboard pages need to render for the
// currently-active client: which client is active, their company profile,
// the account's (entitlement-gated) export branding, and the plan
// entitlements themselves.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getClientContext(supabase: any, userId: string): Promise<ClientContext> {
  const [clientId, entitlements] = await Promise.all([
    getActiveClientId(supabase, userId),
    getEntitlements(supabase, userId),
  ]);

  const [{ data: profile }, { data: accountSettings }] = await Promise.all([
    clientId
      ? supabase.from("company_profiles").select("*").eq("client_id", clientId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("account_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const branding = resolveBranding(accountSettings, entitlements.hasFeature("branding"));
  const companyName = (profile as CompanyProfile | null)?.company_name || "Your Company";

  return { clientId, profile: profile as CompanyProfile | null, companyName, branding, entitlements };
}
