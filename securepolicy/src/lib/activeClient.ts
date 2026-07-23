import { cookies } from "next/headers";

export const ACTIVE_CLIENT_COOKIE = "active_client_id";

// Resolves which client the current request should be scoped to: the
// cookie if it still points at a client the user owns, otherwise their
// oldest client. Returns null if the account has no clients at all yet.
export async function getActiveClientId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value;

  if (cookieClientId) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("id", cookieClientId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return data.id;
  }

  const { data: fallback } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return fallback?.id ?? null;
}
