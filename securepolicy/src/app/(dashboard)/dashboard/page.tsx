import { createClient } from "@/lib/supabase/server";
import { Framework, RemediationTask } from "@/types";
import { getClientContext } from "@/lib/clientContext";
import { isQuebec } from "@/lib/provinceUtils";
import { projectScoreThroughPhase } from "@/lib/roadmapProjection";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { clientId, profile } = await getClientContext(supabase, user!.id);

  const [{ data: client }, { data: allPolicyVersions }, { data: frameworkRows }] = await Promise.all([
    clientId ? supabase.from("clients").select("name").eq("id", clientId).single() : Promise.resolve({ data: null }),
    clientId ? supabase.from("policies").select("id, framework_versions").eq("client_id", clientId) : Promise.resolve({ data: [] }),
    supabase.from("frameworks").select("*"),
  ]);

  const [{ data: latestScan }, { data: tasks }, { data: assessments }, { count: policyCount }] = await Promise.all([
    clientId
      ? supabase.from("attack_surface_reports").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    clientId ? supabase.from("remediation_tasks").select("*").eq("client_id", clientId) : Promise.resolve({ data: [] }),
    clientId ? supabase.from("compliance_assessments").select("framework, overall_score, status").eq("client_id", clientId) : Promise.resolve({ data: [] }),
    clientId ? supabase.from("policies").select("id", { count: "exact", head: true }).eq("client_id", clientId) : Promise.resolve({ count: 0 }),
  ]);

  const currentVersionByKey: Record<string, string> = {};
  (frameworkRows as Framework[] || []).forEach((f) => { currentVersionByKey[f.id] = f.current_version; });
  const outdatedPolicyCount = (allPolicyVersions || []).filter((p) =>
    Object.entries(p.framework_versions || {}).some(
      ([key, oldVersion]) => currentVersionByKey[key] && currentVersionByKey[key] !== oldVersion
    )
  ).length;

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";
  const clientIsQuebec = isQuebec(profile?.province);

  const allTasks = (tasks as RemediationTask[]) || [];
  const openTasks = allTasks.filter((t) => t.status === "open" || t.status === "in_progress");
  const criticalOpenCount = openTasks.filter((t) => t.severity === "critical").length;
  const progressPct = allTasks.length > 0
    ? Math.round((allTasks.filter((t) => t.status === "completed" || t.status === "verified").length / allTasks.length) * 100)
    : null;

  const topPriorities = [...openTasks]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.phase - b.phase)
    .slice(0, 4);

  const breakdown = latestScan?.score_breakdown ?? null;
  const roadmap = breakdown
    ? ([1, 2, 3] as const).map((phase) => ({
        phase,
        potentialScore: projectScoreThroughPhase(breakdown, openTasks, phase),
        actionCount: allTasks.filter((t) => t.phase === phase && (t.status === "open" || t.status === "in_progress")).length,
      }))
    : [];

  const loi25Score = (assessments || []).find((a) => a.framework === "loi25")?.overall_score ?? null;
  const pipedaScore = (assessments || []).find((a) => a.framework === "pipeda")?.overall_score ?? null;
  const loi25Completed = (assessments || []).find((a) => a.framework === "loi25")?.status === "completed";
  const pipedaCompleted = (assessments || []).find((a) => a.framework === "pipeda")?.status === "completed";

  return (
    <DashboardClient
      firstName={firstName}
      clientId={clientId}
      clientName={(client as { name: string } | null)?.name ?? null}
      hasClient={clientId !== null}
      hasProfile={!!profile}
      clientIsQuebec={clientIsQuebec}
      hasScanned={!!latestScan}
      currentScore={latestScan?.risk_score ?? null}
      loi25Score={loi25Score}
      pipedaScore={pipedaScore}
      complianceDone={clientIsQuebec ? loi25Completed : pipedaCompleted}
      openFindingsCount={openTasks.length}
      criticalOpenCount={criticalOpenCount}
      progressPct={progressPct}
      hasRemediationProgress={allTasks.some((t) => t.status !== "open")}
      topPriorities={topPriorities}
      roadmap={roadmap}
      outdatedPolicyCount={outdatedPolicyCount}
      policyCount={policyCount ?? 0}
    />
  );
}
