import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { ScanFinding } from "@/types";

const SEVERITY_STYLE: Record<ScanFinding["severity"], { bg: string; border: string; icon: React.ReactNode }> = {
  high: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <AlertCircle size={16} className="text-red-600" />,
  },
  medium: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <AlertTriangle size={16} className="text-orange-600" />,
  },
  low: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle size={16} className="text-green-600" />,
  },
};

export function FindingCard({ finding }: { finding: ScanFinding }) {
  const style = SEVERITY_STYLE[finding.severity];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{finding.category}</p>
        <p className="text-sm text-gray-800 mt-0.5">{finding.message}</p>
      </div>
    </div>
  );
}
