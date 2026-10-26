import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runPublicScan } from "@/lib/scanners/publicScan";
import { getTrustedClientIp, checkRateLimits, getCachedResult, recordScan, purgeExpired } from "@/lib/publicScanProtection";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { domain: rawDomain, website } = body as { domain?: string; website?: string };

  // Honeypot: a real visitor never fills this hidden field. Silently
  // report success without doing any work — tipping off a bot that it was
  // caught just teaches it to find the real field.
  if (website) {
    return NextResponse.json({ domain: rawDomain ?? "", preliminaryScore: 0, findingsCount: 0, criticalCount: 0 });
  }

  const domain = (rawDomain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const ip = getTrustedClientIp(req.headers);
  if (!ip) {
    return NextResponse.json({ error: "Could not identify request origin" }, { status: 400 });
  }

  const supabase = createAdminClient();
  await purgeExpired(supabase);

  const cached = await getCachedResult(supabase, domain);
  if (cached) return NextResponse.json(cached);

  const { allowed, reason } = await checkRateLimits(supabase, ip);
  if (!allowed) {
    const message = reason === "global"
      ? "High demand right now — please try again in a few minutes."
      : "You've reached the free scan limit for today. Sign up for unlimited scans.";
    return NextResponse.json({ error: message }, { status: 429 });
  }

  const summary = await runPublicScan(domain);
  await recordScan(supabase, ip, domain, summary);

  return NextResponse.json(summary);
}
