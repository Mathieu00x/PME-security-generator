import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PolicyImportance } from "@/types";

const REQUESTER_ICONS: Record<string, string> = {
  "cyber insurer": "🛡️",
  "enterprise client": "🤝",
  "external auditor": "🔍",
  "iso certification": "📋",
  "board": "👔",
  "client": "🤝",
  "insurer": "🛡️",
  "audit": "🔍",
  "certification": "📋",
};

function getIcon(label: string): string {
  const lower = label.toLowerCase();
  const match = Object.entries(REQUESTER_ICONS).find(([key]) => lower.includes(key));
  return match ? match[1] : "📌";
}

export function PolicyImportanceCard({ importance }: { importance: PolicyImportance }) {
  return (
    <Card padding="sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
        <Users size={14} className="text-blue-500" />
        Why this policy matters
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{importance.businessValue}</p>

      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Often required by
      </p>
      <ul className="flex flex-col gap-1.5">
        {importance.requestedBy.map((requester, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
            <span>{getIcon(requester)}</span>
            <span>{requester}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
