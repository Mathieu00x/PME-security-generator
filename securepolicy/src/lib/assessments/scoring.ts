import { AnswerValue, AssessmentAnswer, AssessmentSectionScore } from "@/types";

export interface AssessmentQuestionConfig {
  id: string;
}

export interface AssessmentSectionConfig {
  id: string;
  weight: number;
  questions: AssessmentQuestionConfig[];
}

export interface AssessmentQuestionsConfig {
  sections: AssessmentSectionConfig[];
}

// Single generic scoring function reused by both Loi 25 and PIPEDA — their
// weighted-section-score shapes are identical, so there's no need to duplicate
// the algorithm per framework.
export function calculateComplianceScore(
  answers: Record<string, AssessmentAnswer>,
  questions: AssessmentQuestionsConfig
): { scores: Record<string, AssessmentSectionScore>; overall: number } {
  const scores: Record<string, AssessmentSectionScore> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const section of questions.sections) {
    let points = 0;
    let total = 0;
    for (const q of section.questions) {
      const value: AnswerValue | undefined = answers[q.id]?.value;
      if (value === "na") continue;
      total += 100;
      if (value === "yes") points += 100;
      else if (value === "partial") points += 50;
      // "no" or unanswered = 0
    }
    const pct = total > 0 ? Math.round((points / total) * 100) : 0;
    scores[section.id] = { score: points, total, pct };
    weightedSum += pct * section.weight;
    totalWeight += section.weight;
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { scores, overall };
}
