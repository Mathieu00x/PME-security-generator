import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BillingInterval, PlanId } from "@/types";

// Paid plans (starter/pro/agency) go through /api/subscriptions/checkout and
// are only ever activated by the Stripe webhook on payment confirmation.
// This route only ever grants the free beta plan directly.
const VALID_PLANS: PlanId[] = ["beta"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, billingInterval } = (await req.json()) as {
    planId: PlanId;
    billingInterval: BillingInterval;
  };

  if (!VALID_PLANS.includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).single();
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (plan.id === "beta" && plan.beta_cutoff_at && new Date(plan.beta_cutoff_at) < new Date()) {
    return NextResponse.json({ error: "The beta program is no longer accepting new signups." }, { status: 403 });
  }

  const betaExpiresAt = plan.id === "beta"
    ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan_id: planId,
        billing_interval: billingInterval,
        status: "active",
        beta_expires_at: betaExpiresAt,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  // Make sure the account has at least one client to land on after this.
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count) {
    await supabase.from("clients").insert({ user_id: user.id, name: "My First Client" });
  }

  return NextResponse.json({ subscription });
}
