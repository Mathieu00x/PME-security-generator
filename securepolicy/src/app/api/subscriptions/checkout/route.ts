import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { BillingInterval, PlanId } from "@/types";

const VALID_PLANS: PlanId[] = ["starter", "pro", "agency"];

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
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existingSubscription?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const amount = billingInterval === "annual" ? plan.annual_price_cents : plan.monthly_price_cents;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `SecurePilot — ${plan.name}`, tax_code: "txcd_10103001" },
          unit_amount: amount,
          recurring: { interval: billingInterval === "annual" ? "year" : "month" },
        },
        quantity: 1,
      },
    ],
    metadata: { user_id: user.id, plan_id: planId, billing_interval: billingInterval },
    subscription_data: {
      metadata: { user_id: user.id, plan_id: planId, billing_interval: billingInterval },
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/choose-plan?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
