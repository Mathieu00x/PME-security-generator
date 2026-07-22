import { PrioritizedRecommendation } from "@/types";

export const PRIORITY_ORDER: Record<"high" | "medium" | "low", number> = { high: 0, medium: 1, low: 2 };

// Policies generated before recommendations gained a `priority` field stored
// plain strings — normalize on read so older rows still render correctly.
export function normalizeRecommendation(
  r: PrioritizedRecommendation | string
): PrioritizedRecommendation {
  return typeof r === "string" ? { priority: "medium", text: r } : r;
}
