"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ActionItem } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-600",
};

const PRIORITY_KEY: Record<string, string> = {
  high: "sidebar.actionChecklist.priority.high",
  medium: "sidebar.actionChecklist.priority.medium",
  low: "sidebar.actionChecklist.priority.low",
};

export function ActionChecklist({ actionItems }: { actionItems: ActionItem[] }) {
  const { t } = useLanguage();
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (i: number) =>
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  const done = Object.values(checked).filter(Boolean).length;

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t("sidebar.actionChecklist.title")}</h3>
        <span className="text-xs text-gray-400 font-medium">
          {t("sidebar.actionChecklist.completed", { done, total: actionItems.length })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${actionItems.length ? (done / actionItems.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="flex flex-col gap-3">
        {actionItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={() => toggle(i)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${PRIORITY_STYLE[item.priority]}`}
                >
                  {t(PRIORITY_KEY[item.priority])}
                </span>
              </div>
              <p className={`text-xs text-gray-700 leading-relaxed ${checked[i] ? "line-through text-gray-400" : ""}`}>
                {item.task}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {item.estimatedTime && (
                  <p className="text-[10px] text-gray-400">⏱ {item.estimatedTime}</p>
                )}
                {item.tool && (
                  <p className="text-[10px] text-blue-600">→ {item.tool}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
