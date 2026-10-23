"use client";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AssessmentQuestionnaire } from "@/lib/assessments/loi25-questions";
import { calculateComplianceScore } from "@/lib/assessments/scoring";
import { AnswerValue, AssessmentAnswer, Client, ComplianceAssessment } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const ANSWER_OPTIONS: AnswerValue[] = ["yes", "partial", "no", "na"];
const AUTOSAVE_DELAY_MS = 800;

export function AssessmentClient({
  client,
  assessment: initialAssessment,
  questions,
}: {
  client: Client;
  assessment: ComplianceAssessment;
  questions: AssessmentQuestionnaire;
}) {
  const { t, lang } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>(initialAssessment.answers ?? {});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [generatingActions, setGeneratingActions] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave — no precedent for this in the codebase (every other
  // form is explicit-save-button), introduced here because a multi-section
  // questionnaire that silently drops progress on navigation would be worse
  // than the one new pattern this adds.
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/assessments/${initialAssessment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (!res.ok) throw new Error();
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], value } }));
  }

  function setNotes(questionId: string, notes: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], value: prev[questionId]?.value ?? "no", notes } }));
  }

  function setEvidenceUrl(questionId: string, evidence_url: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], value: prev[questionId]?.value ?? "no", evidence_url } }));
  }

  async function handleGenerateActions() {
    setGeneratingActions(true);
    try {
      const res = await fetch(`/api/assessments/${initialAssessment.id}/generate-actions`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { createdCount } = await res.json();
      toast.success(t("assessment.generateActionsSuccess", { count: createdCount }));
    } catch {
      toast.error(t("assessment.genericError"));
    } finally {
      setGeneratingActions(false);
    }
  }

  const { scores, overall } = calculateComplianceScore(answers, questions);
  const overallLabel =
    overall >= 80 ? t("assessment.overallLabel.aligned") : overall >= 40 ? t("assessment.overallLabel.partial") : t("assessment.overallLabel.notAligned");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">{lang === "fr" ? questions.name_fr : questions.name_en}</h1>
        <span className="text-xs text-gray-400">
          {saveState === "saving" ? t("assessment.saving") : saveState === "saved" ? t("assessment.saved") : ""}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">{lang === "fr" ? questions.description_fr : questions.description_en}</p>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">{t("assessment.readiness")}</h2>
          <span className="text-2xl font-bold text-gray-900">{overall}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${overall >= 80 ? "bg-green-500" : overall >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${overall}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mb-4">{overallLabel}</p>

        <div className="flex flex-col gap-2.5">
          {questions.sections.map((section) => {
            const score = scores[section.id];
            return (
              <div key={section.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-48 flex-shrink-0 truncate">
                  {lang === "fr" ? section.title_fr : section.title_en}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${score.pct >= 80 ? "bg-green-500" : score.pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${score.pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-900 w-10 text-right flex-shrink-0">{score.pct}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        {questions.sections.map((section) => (
          <Card key={section.id}>
            <h2 className="text-base font-semibold text-gray-900 mb-4">{lang === "fr" ? section.title_fr : section.title_en}</h2>
            <div className="flex flex-col gap-5">
              {section.questions.map((q) => {
                const answer = answers[q.id];
                const options = q.type === "yes_no_partial_na" ? ANSWER_OPTIONS : ANSWER_OPTIONS.filter((o) => o !== "na");
                return (
                  <div key={q.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-1.5 mb-2.5">
                      <p className="text-sm font-medium text-gray-800">{lang === "fr" ? q.text_fr : q.text_en}</p>
                      <span title={lang === "fr" ? q.help_fr : q.help_en} className="flex-shrink-0 mt-0.5 cursor-help">
                        <HelpCircle size={13} className="text-gray-300" />
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            answer?.value === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={answer?.value === opt}
                            onChange={() => setAnswer(q.id, opt)}
                            className="accent-blue-600"
                          />
                          {t(`assessment.answer.${opt}`)}
                        </label>
                      ))}
                    </div>
                    {answer?.value && answer.value !== "yes" && (
                      <div className="flex flex-col gap-2 mt-2">
                        <Input
                          placeholder={t("assessment.notes")}
                          value={answer.notes ?? ""}
                          onChange={(e) => setNotes(q.id, e.target.value)}
                          className="text-xs"
                        />
                        <Input
                          placeholder={t("assessment.evidenceUrl")}
                          value={answer.evidence_url ?? ""}
                          onChange={(e) => setEvidenceUrl(q.id, e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleGenerateActions} loading={generatingActions}>
          {!generatingActions && <Sparkles size={14} />}
          {t("assessment.generateActions")}
        </Button>
      </div>
    </div>
  );
}
