import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only contexts with no user session to read
// cookies from (e.g. Stripe webhooks). Bypasses RLS — never import this from
// client code or expose it to a request handler that echoes it back.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
