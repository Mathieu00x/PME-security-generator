import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/activeClient";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const entitlements = await getEntitlements(supabase, user.id);
  if (!entitlements.subscription) {
    return NextResponse.json({ error: "Choose a plan before adding clients." }, { status: 403 });
  }

  if (entitlements.clientLimit !== null) {
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= entitlements.clientLimit) {
      return NextResponse.json(
        { error: `Your ${entitlements.plan?.name} plan is limited to ${entitlements.clientLimit} client${entitlements.clientLimit === 1 ? "" : "s"}. Upgrade to add more.` },
        { status: 403 }
      );
    }
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (error) {
    console.error("Client create error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }

  const res = NextResponse.json({ client });
  res.cookies.set(ACTIVE_CLIENT_COOKIE, client.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
