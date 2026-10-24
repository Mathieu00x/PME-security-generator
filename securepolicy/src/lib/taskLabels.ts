import { ComplianceFramework, KBCategory, RemediationTask } from "@/types";

// Assessment-sourced tasks carry their framework in source_question_id
// ("loi25:rprp_designe" / "pipeda:p1_q1") rather than in `category` (always
// "governance" for these) — this recovers it for display.
export function getTaskFramework(task: RemediationTask): ComplianceFramework | null {
  if (task.source !== "assessment" || !task.source_question_id) return null;
  const prefix = task.source_question_id.split(":")[0];
  return prefix === "loi25" || prefix === "pipeda" ? prefix : null;
}

// Human-readable tag for a task's category chip. Assessment-sourced tasks
// show their framework name (more useful than the generic "governance"
// category); scan-sourced tasks show their KB category.
export function getTaskCategoryKey(task: RemediationTask): string {
  const framework = getTaskFramework(task);
  if (framework) return `tasks.category.${framework}`;
  return `tasks.category.${task.category}`;
}

export const TASK_CATEGORY_KEYS: Record<KBCategory, string> = {
  email_security: "tasks.category.email_security",
  tls: "tasks.category.tls",
  headers: "tasks.category.headers",
  exposure: "tasks.category.exposure",
  subdomain: "tasks.category.subdomain",
  governance: "tasks.category.governance",
};
