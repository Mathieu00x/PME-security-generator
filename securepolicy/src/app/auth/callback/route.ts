import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Continuity for the public homepage scan -> signup funnel: a brand
    // new user (no clients yet) who arrived via /register?domain=X gets
    // that domain turned into their first client automatically, landing
    // on a real scan instead of an empty "add a client" screen. Only acts
    // on a genuinely new account — an existing user confirming e.g. an
    // email change should never have a client silently created for them.
    const pendingDomain = request.cookies.get("pending_scan_domain")?.value;
    if (pendingDomain && data.user) {
      const { count: existingClients } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user.id);

      if (existingClients === 0) {
        const { error } = await supabase
          .from("clients")
          .insert({ user_id: data.user.id, name: decodeURIComponent(pendingDomain) });
        if (!error) {
          next = `/scan?domain=${encodeURIComponent(pendingDomain)}&autorun=1`;
        }
      }
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete("pending_scan_domain");
  return response;
}
