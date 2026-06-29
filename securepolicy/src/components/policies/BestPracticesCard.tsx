"use client";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { BestPractices } from "@/types";

export function BestPracticesCard({ bestPractices }: { bestPractices: BestPractices }) {
  return (
    <Card padding="sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Bonnes pratiques</h3>

      <div className="mb-3">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">✅ À faire</p>
        <ul className="flex flex-col gap-1.5">
          {bestPractices.dos.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">❌ À éviter</p>
        <ul className="flex flex-col gap-1.5">
          {bestPractices.donts.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <XCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
