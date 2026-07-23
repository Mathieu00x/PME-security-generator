import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { BillingInterval, PlanId } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id as PlanId | undefined;
      const billingInterval = session.metadata?.billing_interval as BillingInterval | undefined;
      if (!userId || !planId || !billingInterval) break;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan_id: planId,
          billing_interval: billingInterval,
          status: "active",
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
          stripe_subscription_id:
            typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        },
        { onConflict: "user_id" }
      );

      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (!count) {
        await supabase.from("clients").insert({ user_id: userId, name: "My First Client" });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" ? "active" : "canceled";
      await supabase
        .from("subscriptions")
        .update({ status })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
