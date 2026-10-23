"use client";
import { useState } from "react";
import { Shield } from "lucide-react";
import { FrameworkMappings } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

// Separate from ComplianceBadges.tsx (which covers NIST/CIS/ISO27001/SOC2/Loi25/RGPD)
// because remediation tasks need PIPEDA instead of RGPD — the right set for a
// product targeting Quebec MSPs rather than GDPR-scoped clients.
const STANDARDS: { key: keyof FrameworkMappings; label: string; color: string }[] = [
  { key: "nist_csf", label: "NIST CSF", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { key: "cis_controls", label: "CIS Controls", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { key: "iso_27001", label: "ISO 27001", color: "bg-green-50 text-green-700 border-green-100" },
  { key: "soc2", label: "SOC 2", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { key: "loi_25", label: "Loi 25", color: "bg-orange-50 text-orange-700 border-orange-100" },
  { key: "pipeda", label: "PIPEDA", color: "bg-rose-50 text-rose-700 border-rose-100" },
];

export function FrameworkBadges({ mapping }: { mapping: FrameworkMappings }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const covered = STANDARDS.filter((s) => mapping[s.key]?.length);

  if (!covered.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Shield size={13} className="text-gray-400" />
        <span className="text-xs text-gray-400">{t("complianceBadges.alignedWith")}</span>
        {covered.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setExpanded(expanded === s.key ? null : s.key)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {expanded && (
        <p className="text-xs text-gray-500 pl-5">{(mapping[expanded as keyof FrameworkMappings] ?? []).join(", ")}</p>
      )}
    </div>
  );
}
