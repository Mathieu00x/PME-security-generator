"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, ExternalLink, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AssessmentQuestionnaire } from "@/lib/assessments/loi25-questions";
import { calculateComplianceScore } from "@/lib/assessments/scoring";
import { AnswerValue, AssessmentAnswer, Client, ComplianceAssessment, ComplianceRequirement } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const ANSWER_OPTIONS: AnswerValue[] = ["yes", "partial", "no", "na"];
const AUTOSAVE_DELAY_MS = 800;

export function AssessmentClient({
  client,
  assessment: initialAssessment,
  questions,
  requirements,
}: {
  client: Client;
  assessment: ComplianceAssessment;
  questions: AssessmentQuestionnaire;
  // Keyed by requirement_key ("${framework}:${questionId}"). Empty object
  // until the compliance_requirement table is seeded — the "why/source" panel
  // degrades gracefully to just the existing help text when a question has
  // no matching row yet.
  requirements: Record<string, ComplianceRequirement>;
}) {
  const { t, lang } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>(initialAssessment.answers ?? {});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [generatingActions, setGeneratingActions] = useState(false);
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"in_progress" | "completed">(initialAssessment.status);
  const [completedAt, setCompletedAt] = useState<string | null>(initialAssessment.completed_at);
  const [confirmStep, setConfirmStep] = useState<"complete" | "reopen" | null>(null);
  const [completing, setCompleting] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allQuestionIds = useMemo(
    () => questions.sections.flatMap((s) => s.questions.map((q) => q.id)),
    [questions]
  );
  const allAnswered = allQuestionIds.every((id) => !!answers[id]?.value);
  const isCompleted = status === "completed";

  // Debounced autosave — no precedent for this in the codebase (every other
  // form is explicit-save-button), introduced here because a multi-section
  // questionnaire that silently drops progress on navigation would be worse
  // than the one new pattern this adds.
  useEffect(() => {
    // A completed assessment is read-only until explicitly reopened (see
    // handleReopen), so answers can't change while isCompleted is true — this
    // guard is just a second line of defense against firing a stale autosave.
    if (isCompleted) return;
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
  }, [answers, isCompleted]);

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/assessments/${initialAssessment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, status: "completed" }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Defense-in-depth path: the button is disabled client-side until
        // allAnswered, so this should only fire if that check and the
        // server's got out of sync somehow.
        toast.error(t("assessment.completeError"));
        return;
      }
      setStatus("completed");
      setCompletedAt(data.assessment.completed_at);
      setConfirmStep(null);
      toast.success(t("assessment.completeSuccess"));
    } catch {
      toast.error(t("assessment.genericError"));
    } finally {
      setCompleting(false);
    }
  }

  async function handleReopen() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/assessments/${initialAssessment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      if (!res.ok) throw new Error();
      setStatus("in_progress");
      setCompletedAt(null);
      setConfirmStep(null);
      toast.success(t("assessment.reopenSuccess"));
    } catch {
      toast.error(t("assessment.genericError"));
    } finally {
      setCompleting(false);
    }
  }

  function setAnswer(questionId: string, value: AnswerValue) {
    if (isCompleted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], value } }));
  }

  function setNotes(questionId: string, notes: string) {
    if (isCompleted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], value: prev[questionId]?.value ?? "no", notes } }));
  }

  function setEvidenceUrl(questionId: string, evidence_url: string) {
    if (isCompleted) return;
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
        {!isCompleted && (
          <span className="text-xs text-gray-400">
            {saveState === "saving" ? t("assessment.saving") : saveState === "saved" ? t("assessment.saved") : ""}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">{lang === "fr" ? questions.description_fr : questions.description_en}</p>

      <div className="mb-6">
        {isCompleted ? (
          confirmStep === "reopen" ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <span>{t("assessment.reopenConfirmPrompt")}</span>
              <div className="flex gap-2 ml-auto flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => setConfirmStep(null)}>{t("assessment.cancel")}</Button>
                <Button size="sm" onClick={handleReopen} loading={completing}>{t("assessment.confirm")}</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>
                {t("assessment.completedOn", {
                  date: completedAt ? new Date(completedAt).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", { year: "numeric", month: "long", day: "numeric" }) : "",
                })}
              </span>
              <Button size="sm" variant="outline" className="ml-auto flex-shrink-0" onClick={() => setConfirmStep("reopen")}>
                <RotateCcw size={13} /> {t("assessment.reopenAssessment")}
              </Button>
            </div>
          )
        ) : confirmStep === "complete" ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            <span>{t("assessment.completeConfirmPrompt")}</span>
            <div className="flex gap-2 ml-auto flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => setConfirmStep(null)}>{t("assessment.cancel")}</Button>
              <Button size="sm" onClick={handleComplete} loading={completing}>{t("assessment.confirm")}</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" disabled={!allAnswered} onClick={() => setConfirmStep("complete")}>
              <CheckCircle2 size={13} /> {t("assessment.completeAssessment")}
            </Button>
            {!allAnswered && <span className="text-xs text-gray-400">{t("assessment.incompleteHint")}</span>}
          </div>
        )}
      </div>

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
        <p className="text-xs text-gray-400 mb-1">{overallLabel}</p>
        <p className="text-xs text-gray-400 mb-4 italic">{t("assessment.readinessDisclaimer")}</p>

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
                const requirement = requirements[`${questions.framework}:${q.id}`];
                const isExpanded = !!expandedWhy[q.id];
                return (
                  <div key={q.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-1.5 mb-2.5">
                      <p className="text-sm font-medium text-gray-800">{lang === "fr" ? q.text_fr : q.text_en}</p>
                      <button
                        type="button"
                        onClick={() => setExpandedWhy((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-blue-500"
                        aria-label={t("assessment.whyThisQuestion")}
                      >
                        <HelpCircle size={13} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600 flex flex-col gap-1.5">
                        <p className="font-medium text-gray-700">{t("assessment.whyThisQuestion")}</p>
                        <p>{lang === "fr" ? q.help_fr : q.help_en}</p>
                        {requirement && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-200 mt-1">
                            {requirement.source_reference && <span>{requirement.source_reference}</span>}
                            {requirement.source_url && (
                              <a
                                href={requirement.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                {t("assessment.officialSource")} <ExternalLink size={10} />
                              </a>
                            )}
                            {requirement.review_status === "pending_review" && (
                              <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                                {t("assessment.pendingLegalReview")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap mb-2">
                      {options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                            answer?.value === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600"
                          } ${isCompleted ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={answer?.value === opt}
                            onChange={() => setAnswer(q.id, opt)}
                            disabled={isCompleted}
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
                          disabled={isCompleted}
                          className="text-xs"
                        />
                        <Input
                          placeholder={t("assessment.evidenceUrl")}
                          value={answer.evidence_url ?? ""}
                          onChange={(e) => setEvidenceUrl(q.id, e.target.value)}
                          disabled={isCompleted}
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
