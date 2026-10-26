import { KBCategory, RemediationTask, ScoreBreakdown } from "@/types";
import { calculateRiskScore } from "@/lib/scoring";

// Maps a remediation task's category to the ScoreBreakdown category it
// affects. "governance" (Loi 25 / PIPEDA gaps) doesn't map to any scan score
// category — compliance gaps don't move the external security posture score.
const CATEGORY_TO_SCORE_KEY: Partial<Record<KBCategory, keyof ScoreBreakdown>> = {
  email_security: "dnsEmail",
  tls: "ssl",
  headers: "headers",
  exposure: "dataExposure",
};

// Honest approximation, not a precise per-finding simulation: sslCategoryScore
// and headersCategoryScore are step functions, not sums of independent
// penalties, so there's no clean way to compute "this one task is worth +N
// points." Instead, for a given phase horizon, any score category touched by
// at least one remaining open/in_progress task up through that phase is
// assumed to reach its ceiling (25) once those tasks are done — matching the
// plan's own framing ("chaque tâche complétée restaure les points perdus sur
// cette catégorie").
export function projectScoreThroughPhase(baseline: ScoreBreakdown, tasks: RemediationTask[], upToPhase: 1 | 2 | 3): number {
  const touched = { ssl: false, dnsEmail: false, dataExposure: false, headers: false };
  for (const task of tasks) {
    if (task.status === "completed" || task.status === "verified") continue;
    if (task.phase > upToPhase) continue;
    const key = CATEGORY_TO_SCORE_KEY[task.category];
    if (key) touched[key] = true;
  }

  const projected: ScoreBreakdown = {
    ssl: touched.ssl ? 25 : baseline.ssl,
    // Same null-guard as dataExposure/headers below: dnsEmail only just
    // became nullable (a failed DNS lookup is now excluded rather than
    // scored as "all missing") — forcing it to 25 when it was never
    // evaluated would be the same false-ceiling bug being fixed elsewhere.
    dnsEmail: touched.dnsEmail && baseline.dnsEmail !== null ? 25 : baseline.dnsEmail,
    dataExposure: touched.dataExposure && baseline.dataExposure !== null ? 25 : baseline.dataExposure,
    headers: touched.headers && baseline.headers !== null ? 25 : baseline.headers,
  };

  return calculateRiskScore(projected);
}
