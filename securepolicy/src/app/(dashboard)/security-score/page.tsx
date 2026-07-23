import { createClient } from "@/lib/supabase/server";
import { Policy, SecurityScore, ActionItem } from "@/types";
import { PRIORITY_ORDER, normalizeRecommendation } from "@/lib/securityScore";
import { getActiveClientId } from "@/lib/activeClient";
import { SecurityScoreClient } from "@/components/securityScore/SecurityScoreClient";

export default async function SecurityScorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const clientId = await getActiveClientId(supabase, user!.id);

  const { data: policies } = clientId
    ? await supabase
        .from("policies")
        .select("*")
        .eq("client_id", clientId)
        .not("security_score", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  const allPolicies = (policies as Policy[] | null) ?? [];
  const latestScore = allPolicies[0]?.security_score as SecurityScore | undefined;

  if (!latestScore) {
    return (
      <SecurityScoreClient
        allPolicies={allPolicies}
        latestScore={undefined}
        allStrengths={[]}
        allWeaknesses={[]}
        allActionItems={[]}
        recommendations={[]}
        avgScore={0}
        latestPolicy={undefined}
        scoreHistory={[]}
      />
    );
  }

  // Aggregate strengths/weaknesses across all policies
  const allStrengths = Array.from(
    new Set(allPolicies.flatMap((p) => (p.security_score as SecurityScore)?.strengths ?? []))
  );
  const allWeaknesses = Array.from(
    new Set(allPolicies.flatMap((p) => (p.security_score as SecurityScore)?.weaknesses ?? []))
  );

  // Aggregate and deduplicate action items, sorted by priority
  const allActionItems: ActionItem[] = Array.from(
    new Map(
      allPolicies
        .flatMap((p) => (p.security_score as SecurityScore)?.actionItems ?? [])
        .map((item) => [item.task, item])
    ).values()
  ).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Recommendations from the most recently generated policy, sorted by priority
  const recommendations = (latestScore.recommendations ?? [])
    .map(normalizeRecommendation)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Average score across all policies
  const avgScore = Math.round(
    allPolicies.reduce((sum, p) => sum + ((p.security_score as SecurityScore)?.securityScore ?? 0), 0) /
      allPolicies.length
  );

  const latestPolicy = allPolicies[0];

  // Score history: every version's score, per policy, oldest first
  const { data: versionRows } = await supabase
    .from("policy_versions")
    .select("policy_id, version_number, security_score, created_at")
    .order("version_number", { ascending: true });

  const scoreHistoryByPolicy = new Map<string, number[]>();
  (versionRows || []).forEach((v) => {
    const score = (v.security_score as SecurityScore | null)?.securityScore;
    if (typeof score !== "number") return;
    const existing = scoreHistoryByPolicy.get(v.policy_id) || [];
    existing.push(score);
    scoreHistoryByPolicy.set(v.policy_id, existing);
  });

  const scoreHistory = allPolicies
    .map((p) => ({ policy: p, scores: scoreHistoryByPolicy.get(p.id) || [] }))
    .filter((h) => h.scores.length > 0);

  return (
    <SecurityScoreClient
      allPolicies={allPolicies}
      latestScore={latestScore}
      allStrengths={allStrengths}
      allWeaknesses={allWeaknesses}
      allActionItems={allActionItems}
      recommendations={recommendations}
      avgScore={avgScore}
      latestPolicy={latestPolicy}
      scoreHistory={scoreHistory}
    />
  );
}
