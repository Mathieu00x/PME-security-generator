import crypto from "node:crypto";
import { SupabaseClient } from "@supabase/supabase-js";

const PER_IP_MAX_PER_DAY = 3;
const PER_IP_WINDOW_MS = 24 * 60 * 60 * 1000;
const DOMAIN_CACHE_WINDOW_MS = 60 * 60 * 1000; // 1h
const GLOBAL_HOURLY_CAP = 500; // circuit breaker, not a per-user limit
const RETENTION_MS = 24 * 60 * 60 * 1000;

// A bare hash of an IPv4 address is reversible in practice — only ~4
// billion possible values, trivially brute-forced offline. HMAC with a
// server-only secret (never derivable from the output) is what actually
// makes this a one-way, unlinkable identifier rather than a hash wearing a
// disguise. IPv6 is hashed by its /64 prefix, not the full address —
// otherwise anyone bypasses the per-IP limit by changing the low 64 bits,
// which most residential/cloud IPv6 allocations let a single user do
// freely within their own /64 or larger block.
function hmacIp(ip: string): string {
  const secret = process.env.SCAN_IP_HMAC_SECRET;
  if (!secret) throw new Error("SCAN_IP_HMAC_SECRET is not configured");

  const normalized = ip.includes(":") ? ip.split(":").slice(0, 4).join(":") + "::/64" : ip;
  return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
}

// Trusts only Vercel's own x-forwarded-for header, set by Vercel's edge and
// overwritten (not appended-to) for traffic actually passing through
// Vercel's network — a client cannot inject an arbitrary value into it from
// outside. A raw X-Forwarded-For is only trustworthy when read this way,
// behind a known proxy that controls it; reading it from an arbitrary
// client-facing app would let anyone claim any IP and bypass the limit
// entirely.
export function getTrustedClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (!xff) return null;
  return xff.split(",")[0].trim() || null;
}

export interface RateLimitDecision {
  allowed: boolean;
  reason?: "per_ip" | "global";
}

export async function checkRateLimits(supabase: SupabaseClient, ip: string): Promise<RateLimitDecision> {
  const ipHmac = hmacIp(ip);
  const now = Date.now();

  const [{ count: globalCount }, { count: ipCount }] = await Promise.all([
    supabase
      .from("public_scan_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(now - 60 * 60 * 1000).toISOString()),
    supabase
      .from("public_scan_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hmac", ipHmac)
      .gte("created_at", new Date(now - PER_IP_WINDOW_MS).toISOString()),
  ]);

  if ((globalCount ?? 0) >= GLOBAL_HOURLY_CAP) return { allowed: false, reason: "global" };
  if ((ipCount ?? 0) >= PER_IP_MAX_PER_DAY) return { allowed: false, reason: "per_ip" };
  return { allowed: true };
}

// A cache hit costs nothing (no outbound scanning) and intentionally
// bypasses the per-IP counter entirely — the limit exists to bound how
// much *scanning work* an IP can trigger, not how many times a cached
// result can be read. Someone scanning the same domain a minute after a
// stranger did gets an instant answer instead of a wasted duplicate scan.
export async function getCachedResult(supabase: SupabaseClient, domain: string) {
  const { data } = await supabase
    .from("public_scan_requests")
    .select("result_summary")
    .eq("domain", domain)
    .gte("created_at", new Date(Date.now() - DOMAIN_CACHE_WINDOW_MS).toISOString())
    .not("result_summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.result_summary ?? null;
}

export async function recordScan(supabase: SupabaseClient, ip: string, domain: string, resultSummary: unknown) {
  await supabase.from("public_scan_requests").insert({ ip_hmac: hmacIp(ip), domain, result_summary: resultSummary });
}

// Best-effort hygiene, called inline rather than via a separate cron — this
// table is low-stakes and self-contained, not worth a dedicated scheduled
// job for a 24h retention window. "Purge after 24h" from the review is
// satisfied by actually deleting rows, not just filtering them out of
// future queries.
export async function purgeExpired(supabase: SupabaseClient) {
  await supabase.from("public_scan_requests").delete().lt("created_at", new Date(Date.now() - RETENTION_MS).toISOString());
}
