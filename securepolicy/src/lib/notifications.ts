import { SupabaseClient } from "@supabase/supabase-js";
import { Framework, Policy, SecurityScore } from "@/types";
import { COMPLIANCE_STANDARD_LABELS } from "@/lib/complianceLabels";

// Reactively (re)computes compliance notifications for a user. There is no
// scheduler in this app, so this runs on every dashboard page load instead
// of a cron job. `dedupe_key` + `ignoreDuplicates` means an existing
// notification's read/unread state is never clobbered by a re-run.
export async function ensureComplianceNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string
): Promise<void> {
  const [{ data: frameworkRows }, { data: policyRows }] = await Promise.all([
    supabase.from("frameworks").select("id, current_version"),
    supabase
      .from("policies")
      .select("id, title, framework_versions, security_score")
      .eq("user_id", userId),
  ]);

  const versionByKey: Record<string, string> = {};
  (frameworkRows as Pick<Framework, "id" | "current_version">[] || []).forEach((f) => {
    versionByKey[f.id] = f.current_version;
  });

  const policies = (policyRows as Pick<Policy, "id" | "title" | "framework_versions" | "security_score">[]) || [];

  const rows: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    link: string;
    dedupe_key: string;
  }[] = [];

  policies.forEach((p) => {
    Object.entries(p.framework_versions || {}).forEach(([key, oldVersion]) => {
      const current = versionByKey[key];
      if (current && current !== oldVersion) {
        rows.push({
          user_id: userId,
          type: "framework_outdated",
          title: `${p.title} references an outdated ${COMPLIANCE_STANDARD_LABELS[key] || key} revision`,
          body: `Generated against v${oldVersion}, current is v${current}. Regenerate to align.`,
          link: `/generate?regenerate=${p.id}`,
          dedupe_key: `framework_outdated:${p.id}:${key}:${current}`,
        });
      }
    });

    const gap = (p.security_score as SecurityScore | undefined)?.gapAnalysis;
    if (gap && gap.associatedRisk === "High") {
      rows.push({
        user_id: userId,
        type: "gap_risk",
        title: `${p.title} has a high compliance gap risk`,
        body: `Only ${gap.compliancePercentage}% compliant with ${gap.missingControlsCount} missing control${gap.missingControlsCount === 1 ? "" : "s"}.`,
        link: `/policies/${p.id}`,
        dedupe_key: `gap_risk:${p.id}`,
      });
    }
  });

  if (rows.length === 0) return;

  await supabase.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
}
