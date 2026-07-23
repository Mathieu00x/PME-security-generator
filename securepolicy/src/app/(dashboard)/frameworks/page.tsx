import { createClient } from "@/lib/supabase/server";
import { Framework, Policy } from "@/types";
import { getActiveClientId } from "@/lib/activeClient";
import { FrameworksClient } from "@/components/frameworks/FrameworksClient";
import { FRAMEWORKS } from "@/lib/frameworksData";

export default async function FrameworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const clientId = await getActiveClientId(supabase, user!.id);

  const [{ data: frameworkRows }, { data: policyRows }] = await Promise.all([
    supabase.from("frameworks").select("*"),
    clientId
      ? supabase.from("policies").select("id, title, framework_versions, security_score").eq("client_id", clientId)
      : Promise.resolve({ data: [] }),
  ]);

  const versionByKey: Record<string, Framework> = {};
  (frameworkRows as Framework[] || []).forEach((f) => { versionByKey[f.id] = f; });

  const policies = (policyRows as Pick<Policy, "id" | "title" | "framework_versions" | "security_score">[]) || [];

  const affectedByKey: Record<string, { id: string; title: string; oldVersion: string }[]> = {};
  policies.forEach((p) => {
    Object.entries(p.framework_versions || {}).forEach(([key, oldVersion]) => {
      const current = versionByKey[key]?.current_version;
      if (current && current !== oldVersion) {
        affectedByKey[key] = affectedByKey[key] || [];
        affectedByKey[key].push({ id: p.id, title: p.title, oldVersion });
      }
    });
  });

  const totalAffected = new Set(Object.values(affectedByKey).flat().map((a) => a.id)).size;

  // Multi-framework dashboard: average gap-analysis compliance % per framework,
  // across every policy whose complianceMapping references it.
  const complianceStats: Record<string, { policyCount: number; avgCompliance: number | null }> = {};
  FRAMEWORKS.forEach((fw) => {
    const covering = policies.filter((p) => (p.security_score?.complianceMapping as Record<string, string[]> | undefined)?.[fw.complianceKey]?.length);
    const withGap = covering.filter((p) => p.security_score?.gapAnalysis);
    const avgCompliance = withGap.length
      ? Math.round(withGap.reduce((sum, p) => sum + (p.security_score!.gapAnalysis!.compliancePercentage), 0) / withGap.length)
      : null;
    complianceStats[fw.complianceKey] = { policyCount: covering.length, avgCompliance };
  });

  return (
    <FrameworksClient
      versionByKey={versionByKey}
      affectedByKey={affectedByKey}
      totalAffected={totalAffected}
      complianceStats={complianceStats}
    />
  );
}
