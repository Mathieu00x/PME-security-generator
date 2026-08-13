"use client";

import { Card } from "@/components/ui/Card";
import { AttackSurfaceReport } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

type TParams = Record<string, string | number>;

interface Action {
  severity: "high" | "medium" | "low";
  key: string;
  params?: TParams;
}

const BADGE: Record<Action["severity"], { emoji: string; labelKey: string; className: string }> = {
  high: { emoji: "🔴", labelKey: "scan.report.priority.critical", className: "text-red-600" },
  medium: { emoji: "🟡", labelKey: "scan.report.priority.medium", className: "text-yellow-600" },
  low: { emoji: "🟢", labelKey: "scan.report.priority.good", className: "text-green-600" },
};

// Derived directly from the raw scanner results (not the pre-built findings
// list) so each action maps to an unambiguous, translatable template instead
// of pattern-matching French finding text.
function buildActions(report: AttackSurfaceReport): Action[] {
  const { ssl, dns, emails_compromis: hibp, security_headers: headers } = report;
  const actionable: Action[] = [];
  const good: Action[] = [];

  if (!ssl.hasSSL) {
    actionable.push({ severity: "high", key: "priorityAction.ssl.noSSL" });
  } else if (ssl.expired) {
    actionable.push({ severity: "high", key: "priorityAction.ssl.expired" });
  } else if (ssl.daysUntilExpiry !== null && ssl.daysUntilExpiry < 30) {
    actionable.push({ severity: "medium", key: "priorityAction.ssl.expiringSoon", params: { days: ssl.daysUntilExpiry } });
  } else if (ssl.grade && ["C", "D", "E", "F"].includes(ssl.grade)) {
    actionable.push({ severity: "medium", key: "priorityAction.ssl.weakGrade", params: { grade: ssl.grade } });
  } else if (ssl.grade) {
    good.push({ severity: "low", key: "priorityAction.ssl.good", params: { grade: ssl.grade } });
  }

  if (hibp.compromisedCount > 0) {
    actionable.push({
      severity: hibp.compromisedCount > 5 ? "high" : "medium",
      key: "priorityAction.hibp.compromised",
      params: { count: hibp.compromisedCount },
    });
  } else if (!hibp.error) {
    good.push({ severity: "low", key: "priorityAction.hibp.good" });
  }

  if (!dns.hasSPF) actionable.push({ severity: "medium", key: "priorityAction.dns.spfMissing" });
  if (!dns.hasDMARC) actionable.push({ severity: "medium", key: "priorityAction.dns.dmarcMissing" });
  if (!dns.hasDKIM) actionable.push({ severity: "medium", key: "priorityAction.dns.dkimMissing" });
  if (dns.hasSPF && dns.hasDMARC && dns.hasDKIM) good.push({ severity: "low", key: "priorityAction.dns.good" });

  if (!headers.error) {
    if (!headers.hasHSTS) actionable.push({ severity: "medium", key: "priorityAction.headers.hstsMissing" });
    if (!headers.hasCSP) actionable.push({ severity: "medium", key: "priorityAction.headers.cspMissing" });
    if (headers.missingCount === 0) good.push({ severity: "low", key: "priorityAction.headers.good" });
  }

  const sorted = actionable.sort((a, b) => (a.severity === "high" ? 0 : 1) - (b.severity === "high" ? 0 : 1));
  const top = sorted.slice(0, 5);
  if (top.length < 3) top.push(...good.slice(0, 3 - top.length));
  return top.slice(0, 5);
}

export function PriorityActions({ report }: { report: AttackSurfaceReport }) {
  const { t } = useLanguage();
  const actions = buildActions(report);

  if (actions.length === 0) return null;

  return (
    <Card className="mb-4">
      <h2 className="font-semibold text-gray-900 mb-3">{t("scan.report.priorityActions")}</h2>
      <div className="flex flex-col gap-2">
        {actions.map((action, i) => {
          const badge = BADGE[action.severity];
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span>{badge.emoji}</span>
              <span className={`font-semibold w-16 flex-shrink-0 ${badge.className}`}>{t(badge.labelKey)}</span>
              <span className="text-gray-700">
                {t(action.key, action.params)}
                {action.severity === "low" ? " ✓" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
