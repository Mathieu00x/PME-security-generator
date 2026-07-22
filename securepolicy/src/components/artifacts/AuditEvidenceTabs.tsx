"use client";

import { useState } from "react";
import { ARTIFACT_ORDER, ARTIFACT_DEFINITIONS } from "@/lib/artifacts";
import { ArtifactRow, ArtifactType, Branding } from "@/types";
import { ArtifactRegisterEditor } from "@/components/artifacts/ArtifactRegisterEditor";

export function AuditEvidenceTabs({
  artifactsByType,
  companyName,
  branding,
}: {
  artifactsByType: Record<ArtifactType, ArtifactRow[]>;
  companyName: string;
  branding?: Branding;
}) {
  const [activeType, setActiveType] = useState<ArtifactType>(ARTIFACT_ORDER[0]);

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit flex-wrap">
        {ARTIFACT_ORDER.map((type) => {
          const count = artifactsByType[type].length;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeType === type
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {ARTIFACT_DEFINITIONS[type].title}
              {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
            </button>
          );
        })}
      </div>

      <ArtifactRegisterEditor
        key={activeType}
        definition={ARTIFACT_DEFINITIONS[activeType]}
        initialItems={artifactsByType[activeType]}
        companyName={companyName}
        branding={branding}
      />
    </div>
  );
}
