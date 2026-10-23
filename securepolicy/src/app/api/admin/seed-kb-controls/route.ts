import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KB_SEED_DATA } from "@/lib/kbSeedData";

export async function POST(req: NextRequest) {
  const expectedToken = process.env.ADMIN_SECRET_TOKEN;

  // Fail CLOSED if the secret isn't configured — unlike cron/reengagement/route.ts,
  // which fails open (allows the request) when CRON_SECRET is unset. This route
  // mutates data, so it must never run unauthenticated.
  if (!expectedToken) {
    return NextResponse.json({ error: "Admin endpoint not configured" }, { status: 503 });
  }

  // Deliberately NOT the standard "Authorization" header: Vercel's edge layer
  // reserves/intercepts "Authorization" for its own OIDC / deployment
  // protection handling on this project (confirmed empirically — a correctly
  // configured Bearer token never reached this handler, arriving as an empty
  // header every time). A custom header name avoids that collision entirely.
  const token = req.headers.get("x-admin-token");
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("kb_controls").upsert(KB_SEED_DATA, { onConflict: "code" });

  if (error) {
    console.error("seed-kb-controls: upsert failed", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }

  return NextResponse.json({ seeded: KB_SEED_DATA.length });
}
