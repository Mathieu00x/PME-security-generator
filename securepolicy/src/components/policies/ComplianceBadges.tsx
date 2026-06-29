import { Shield } from "lucide-react";

interface ComplianceMapping {
  NIST?: string[];
  CIS?: string[];
  ISO27001?: string[];
}

const STANDARDS = [
  { key: "NIST", label: "NIST CSF", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { key: "CIS", label: "CIS Controls", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { key: "ISO27001", label: "ISO 27001", color: "bg-green-50 text-green-700 border-green-100" },
];

export function ComplianceBadges({ mapping }: { mapping: ComplianceMapping }) {
  const covered = STANDARDS.filter(
    (s) => mapping[s.key as keyof ComplianceMapping]?.length
  );

  if (!covered.length) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Shield size={13} className="text-gray-400" />
      <span className="text-xs text-gray-400">Aligné avec :</span>
      {covered.map((s) => (
        <span
          key={s.key}
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}
          title={(mapping[s.key as keyof ComplianceMapping] ?? []).join(", ")}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}
