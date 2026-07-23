import { Plan, PlanFeature, Subscription } from "@/types";

export interface Entitlements {
  subscription: Subscription | null;
  plan: Plan | null;
  hasFeature: (feature: PlanFeature) => boolean;
  clientLimit: number | null;
}

const NO_ENTITLEMENTS: Entitlements = {
  subscription: null,
  plan: null,
  hasFeature: () => false,
  clientLimit: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEntitlements(supabase: any, userId: string): Promise<Entitlements> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription) return NO_ENTITLEMENTS;

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", subscription.plan_id)
    .single();

  if (!plan) return NO_ENTITLEMENTS;

  const features = (plan.features || []) as PlanFeature[];

  return {
    subscription: subscription as Subscription,
    plan: plan as Plan,
    hasFeature: (feature) => features.includes(feature),
    clientLimit: plan.client_limit,
  };
}
