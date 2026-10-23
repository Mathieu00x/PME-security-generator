"use client";
import Link from "next/link";
import { Radar, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Client, RemediationTask, RemediationStatus, KBSeverity } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const SEVERITY_STYLE: Record<KBSeverity, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-600",
};

const STATUS_STYLE: Record<RemediationStatus, string> = {
  open: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  verified: "bg-emerald-100 text-emerald-700",
};

const STATUS_KEY: Record<RemediationStatus, string> = {
  open: "tasks.status.open",
  in_progress: "tasks.status.inProgress",
  completed: "tasks.status.completed",
  verified: "tasks.status.verified",
};

const SEVERITY_KEY: Record<KBSeverity, string> = {
  critical: "tasks.severity.critical",
  high: "tasks.severity.high",
  medium: "tasks.severity.medium",
  low: "tasks.severity.low",
};

const PHASE_KEY: Record<number, string> = {
  1: "tasks.phase.1",
  2: "tasks.phase.2",
  3: "tasks.phase.3",
};

export function TasksClient({
  client,
  tasks,
  hasScans,
}: {
  client: Client;
  tasks: RemediationTask[];
  hasScans: boolean;
}) {
  const { t, lang } = useLanguage();

  if (tasks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("tasks.list.title")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("tasks.list.subtitle")}</p>
        <Card className="text-center py-12">
          {hasScans ? (
            <>
              <ClipboardList size={32} className="mx-auto text-green-500 mb-3" />
              <p className="text-gray-600 text-sm">{t("tasks.list.emptyAllClear")}</p>
            </>
          ) : (
            <>
              <Radar size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 text-sm mb-4">{t("tasks.list.emptyNoScans")}</p>
              <Link href="/scan">
                <Button size="sm">{t("tasks.list.emptyNoScans.cta")}</Button>
              </Link>
            </>
          )}
        </Card>
      </div>
    );
  }

  const phases: (1 | 2 | 3)[] = [1, 2, 3];
  const tasksByPhase = phases.map((phase) => ({
    phase,
    items: tasks
      .filter((t) => t.phase === phase)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      }),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("tasks.list.title")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("tasks.list.subtitle")}</p>

      <div className="flex flex-col gap-6">
        {tasksByPhase.map(({ phase, items }) =>
          items.length === 0 ? null : (
            <div key={phase}>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">{t(PHASE_KEY[phase])}</h2>
              <div className="flex flex-col gap-2">
                {items.map((task) => (
                  <Link key={task.id} href={`/clients/${client.id}/tasks/${task.id}`}>
                    <Card padding="sm" className="hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${SEVERITY_STYLE[task.severity]}`}>
                              {t(SEVERITY_KEY[task.severity])}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[task.status]}`}>
                              {t(STATUS_KEY[task.status])}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {lang === "fr" ? task.title_fr : task.title_en}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{task.category}</p>
                        </div>
                        <span className="text-xs text-blue-600 whitespace-nowrap flex-shrink-0">
                          {t("tasks.card.viewDetails")}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
