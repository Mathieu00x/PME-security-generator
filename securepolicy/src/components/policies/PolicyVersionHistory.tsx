"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PolicyViewer } from "@/components/policies/PolicyViewer";
import { PolicyVersion } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const CHANGE_KEY: Record<string, string> = {
  generated: "versionHistory.change.generated",
  regenerated: "versionHistory.change.regenerated",
  restored: "versionHistory.change.restored",
};

export function PolicyVersionHistory({
  policyId,
  currentVersionNumber,
  versions,
}: {
  policyId: string;
  currentVersionNumber: number;
  versions: PolicyVersion[];
}) {
  const { t, dateLocale } = useLanguage();
  const router = useRouter();
  const [viewing, setViewing] = useState<PolicyVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  function changeLabel(type: string): string {
    return CHANGE_KEY[type] ? t(CHANGE_KEY[type]) : type;
  }

  async function handleRestore(version: PolicyVersion) {
    setRestoring(true);
    try {
      const res = await fetch(`/api/policies/${policyId}/versions/${version.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("versionHistory.restoreFailed"));
      }
      toast.success(t("versionHistory.restored", { version: version.version_number }));
      setViewing(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("versionHistory.genericError");
      toast.error(message);
    } finally {
      setRestoring(false);
    }
  }

  if (viewing) {
    const isCurrent = viewing.version_number === currentVersionNumber;
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewing(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <X size={14} /> {t("versionHistory.backToList")}
          </button>
          {!isCurrent && (
            <Button size="sm" onClick={() => handleRestore(viewing)} disabled={restoring}>
              <RotateCcw size={14} />
              {restoring ? t("versionHistory.restoring") : t("versionHistory.restoreThis")}
            </Button>
          )}
        </div>
        <div className="mb-4 text-xs text-gray-400">
          v{viewing.version_number}.0 · {changeLabel(viewing.change_type)} ·{" "}
          {new Date(viewing.created_at).toLocaleString(dateLocale)}
        </div>
        <PolicyViewer content={viewing.content} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {versions.map((v) => {
        const isCurrent = v.version_number === currentVersionNumber;
        return (
          <button
            key={v.id}
            onClick={() => setViewing(v)}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">v{v.version_number}.0</span>
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {t("versionHistory.current")}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {changeLabel(v.change_type)}
                </span>
              </div>
              {v.change_summary && (
                <p className="text-xs text-gray-400 mt-1">{v.change_summary}</p>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(v.created_at).toLocaleDateString(dateLocale, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
