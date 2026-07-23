import { createClient } from "@/lib/supabase/server";
import { Framework, Policy } from "@/types";
import { PRIORITY_ORDER, normalizeRecommendation } from "@/lib/securityScore";
import { getClientContext } from "@/lib/clientContext";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { clientId, profile } = await getClientContext(supabase, user!.id);

  const { data: policies } = clientId
    ? await supabase
        .from("policies")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const [{ data: frameworkRows }, { data: allPolicyVersions }, { count: scanCount }] = await Promise.all([
    supabase.from("frameworks").select("*"),
    clientId ? supabase.from("policies").select("id, framework_versions").eq("client_id", clientId) : Promise.resolve({ data: [] }),
    clientId
      ? supabase.from("attack_surface_reports").select("id", { count: "exact", head: true }).eq("client_id", clientId)
      : Promise.resolve({ count: 0 }),
  ]);

  const currentVersionByKey: Record<string, string> = {};
  (frameworkRows as Framework[] || []).forEach((f) => { currentVersionByKey[f.id] = f.current_version; });

  const outdatedPolicyCount = (allPolicyVersions || []).filter((p) =>
    Object.entries(p.framework_versions || {}).some(
      ([key, oldVersion]) => currentVersionByKey[key] && currentVersionByKey[key] !== oldVersion
    )
  ).length;

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";

  // Get latest security score from most recent policy
  const latestScore = (policies as Policy[] | null)?.find((p) => p.security_score)?.security_score;

  const topRecommendations = latestScore
    ? latestScore.recommendations
        .map(normalizeRecommendation)
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        .slice(0, 4)
    : [];

  return (
    <DashboardClient
      firstName={firstName}
      scanCount={scanCount ?? 0}
      policies={(policies as Policy[]) || []}
      latestScore={latestScore}
      topRecommendations={topRecommendations}
      outdatedPolicyCount={outdatedPolicyCount}
      clientId={clientId}
      hasProfile={!!profile}
    />
  );
}
