"use client";

import { useState } from "react";
import { FileText, Clock } from "lucide-react";
import { PolicyViewer } from "@/components/policies/PolicyViewer";
import { PolicyVersionHistory } from "@/components/policies/PolicyVersionHistory";
import { PolicyVersion } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const TABS = [
  { id: "document", labelKey: "tabs.document", icon: FileText },
  { id: "history", labelKey: "tabs.versionHistory", icon: Clock },
] as const;

export function PolicyDetailTabs({
  policyId,
  content,
  currentVersionNumber,
  versions,
  showHistory = true,
}: {
  policyId: string;
  content: string;
  currentVersionNumber: number;
  versions: PolicyVersion[];
  showHistory?: boolean;
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("document");
  const visibleTabs = showHistory ? TABS : TABS.filter((t) => t.id !== "history");

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {visibleTabs.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={13} />
            {t(labelKey)}
            {id === "history" && versions.length > 0 && (
              <span className="text-xs text-gray-400">({versions.length})</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "document" && <PolicyViewer content={content} />}
      {activeTab === "history" && (
        <PolicyVersionHistory
          policyId={policyId}
          currentVersionNumber={currentVersionNumber}
          versions={versions}
        />
      )}
    </div>
  );
}
