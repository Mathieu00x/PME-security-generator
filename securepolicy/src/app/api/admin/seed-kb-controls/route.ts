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

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${expectedToken}`) {
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
