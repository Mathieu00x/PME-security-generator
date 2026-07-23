import { SupabaseClient } from "@supabase/supabase-js";

// Lightweight per-user rate limiting backed by existing tables — counts how
// many rows a user has created in the lookback window. No new infrastructure
// (Redis, etc.) needed; good enough to stop accidental/abusive hammering of
// costly external APIs (Anthropic, HIBP, VirusTotal).
export async function checkRateLimit(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  { windowMinutes, max, userColumn = "user_id" }: { windowMinutes: number; max: number; userColumn?: string }
): Promise<{ limited: boolean; retryAfterMinutes: number }> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(userColumn, userId)
    .gte("created_at", since);

  return {
    limited: (count ?? 0) >= max,
    retryAfterMinutes: windowMinutes,
  };
}
