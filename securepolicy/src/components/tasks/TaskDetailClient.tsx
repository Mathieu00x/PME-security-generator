"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FrameworkBadges } from "@/components/tasks/FrameworkBadges";
import { Client, RemediationStatus, RemediationTask } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const STATUS_OPTIONS: RemediationStatus[] = ["open", "in_progress", "completed", "verified"];

export function TaskDetailClient({ client, task: initialTask }: { client: Client; task: RemediationTask }) {
  const { t, lang } = useLanguage();
  const [task, setTask] = useState(initialTask);
  const [status, setStatus] = useState<RemediationStatus>(task.status);
  const [ownerName, setOwnerName] = useState(task.owner_name ?? "");
  const [ownerEmail, setOwnerEmail] = useState(task.owner_email ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [evidenceNotes, setEvidenceNotes] = useState(task.evidence_notes ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(task.evidence_url ?? "");
  const [saving, setSaving] = useState(false);
  const [generatingContext, setGeneratingContext] = useState(false);

  const title = lang === "fr" ? task.title_fr : task.title_en;
  const why = lang === "fr" ? task.why_it_matters_fr : task.why_it_matters_en;
  const impact = lang === "fr" ? task.business_impact_fr : task.business_impact_en;
  const steps = lang === "fr" ? task.remediation_steps_fr : task.remediation_steps_en;
  const evidence = lang === "fr" ? task.evidence_required_fr : task.evidence_required_en;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/remediation-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          owner_name: ownerName || null,
          owner_email: ownerEmail || null,
          due_date: dueDate || null,
          evidence_notes: evidenceNotes || null,
          evidence_url: evidenceUrl || null,
        }),
      });
      if (!res.ok) throw new Error();
      const { task: updated } = await res.json();
      setTask(updated);
      toast.success(t("tasks.detail.saveSuccess"));
    } catch {
      toast.error(t("tasks.detail.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateContext() {
    setGeneratingContext(true);
    try {
      const res = await fetch(`/api/remediation-tasks/${task.id}/ai-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (!res.ok) throw new Error();
      const { ai_context } = await res.json();
      setTask((prev) => ({ ...prev, ai_context }));
    } catch {
      toast.error(t("tasks.detail.aiContext.error"));
    } finally {
      setGeneratingContext(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/clients/${client.id}/tasks`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} />
        {t("tasks.detail.backToList")}
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-xs text-gray-400 mb-6">
        {task.category} · {task.control_code ?? task.source_question_id}
      </p>

      <div className="flex flex-col gap-4 mb-6">
        {why && (
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t("tasks.detail.whyItMatters")}</h3>
            <p className="text-sm text-gray-600">{why}</p>
          </Card>
        )}

        {impact && (
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t("tasks.detail.businessImpact")}</h3>
            <p className="text-sm text-gray-600">{impact}</p>
          </Card>
        )}

        {steps.length > 0 && (
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("tasks.detail.remediationSteps")}</h3>
            <ol className="flex flex-col gap-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        )}

        {evidence.length > 0 && (
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("tasks.detail.evidenceRequired")}</h3>
            <ul className="flex flex-col gap-1.5">
              {evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="mt-1 w-3.5 h-3.5 rounded border-gray-300 text-blue-600" disabled />
                  {e}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card padding="sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("tasks.detail.frameworkAlignment")}</h3>
          <FrameworkBadges mapping={task.framework_mappings} />
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{t("tasks.detail.aiContext.heading")}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateContext}
              loading={generatingContext}
            >
              {!generatingContext && <Sparkles size={14} />}
              {task.ai_context ? t("tasks.detail.aiContext.regenerate") : t("tasks.detail.aiContext.generate")}
            </Button>
          </div>
          {generatingContext ? (
            <p className="text-sm text-gray-400 flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" /> {t("tasks.detail.aiContext.generating")}
            </p>
          ) : task.ai_context ? (
            <p className="text-sm text-gray-700">{task.ai_context}</p>
          ) : null}
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{t("tasks.detail.management")}</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            label={t("tasks.detail.ownerName")}
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
          <Input
            label={t("tasks.detail.ownerEmail")}
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
          <Input
            label={t("tasks.detail.dueDate")}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            label={t("tasks.detail.status")}
            value={status}
            onChange={(e) => setStatus(e.target.value as RemediationStatus)}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: t(`tasks.status.${s === "in_progress" ? "inProgress" : s}`) }))}
          />
        </div>
        <div className="flex flex-col gap-3 mb-4">
          <Input
            label={t("tasks.detail.evidenceUrl")}
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{t("tasks.detail.evidenceNotes")}</label>
            <textarea
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {t("tasks.detail.save")}
        </Button>
      </Card>
    </div>
  );
}
