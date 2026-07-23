import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plan, Subscription } from "@/types";
import { ChoosePlanClient } from "@/components/plans/ChoosePlanClient";

export default async function ChoosePlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: plans }, { data: subscription }] = await Promise.all([
    supabase.from("plans").select("*").order("sort_order", { ascending: true }),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <ChoosePlanClient
      plans={(plans as Plan[]) || []}
      currentSubscription={subscription as Subscription | null}
    />
  );
}
