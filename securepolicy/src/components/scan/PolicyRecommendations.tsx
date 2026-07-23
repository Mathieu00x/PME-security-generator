"use client";
import Link from "next/link";
import { Lock, AlertTriangle, HardDrive, Monitor, Wifi, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PolicyType } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const POLICY_INFO: Record<PolicyType, { labelKey: string; descKey: string; icon: React.ReactNode }> = {
  password: {
    labelKey: "scan.policy.password.label",
    descKey: "scan.policy.password.desc",
    icon: <Lock size={18} />,
  },
  "incident-response": {
    labelKey: "scan.policy.incidentResponse.label",
    descKey: "scan.policy.incidentResponse.desc",
    icon: <AlertTriangle size={18} />,
  },
  backup: {
    labelKey: "scan.policy.backup.label",
    descKey: "scan.policy.backup.desc",
    icon: <HardDrive size={18} />,
  },
  "acceptable-use": {
    labelKey: "scan.policy.acceptableUse.label",
    descKey: "scan.policy.acceptableUse.desc",
    icon: <Monitor size={18} />,
  },
  "remote-work": {
    labelKey: "scan.policy.remoteWork.label",
    descKey: "scan.policy.remoteWork.desc",
    icon: <Wifi size={18} />,
  },
};

const URGENT_TYPES: PolicyType[] = ["password", "incident-response"];

export function PolicyRecommendations({
  recommendedPolicies,
  scanId,
  hasCompromisedEmails,
}: {
  recommendedPolicies: PolicyType[];
  scanId: string;
  hasCompromisedEmails: boolean;
}) {
  const { t } = useLanguage();
  if (recommendedPolicies.length === 0) return null;

  return (
    <Card>
      <h2 className="font-semibold text-gray-900 mb-1">{t("scan.report.recommendedPolicies")}</h2>
      <p className="text-xs text-gray-400 mb-4">{t("scan.report.basedOn")}</p>
      <div className="flex flex-col gap-2">
        {recommendedPolicies.map((type) => {
          const info = POLICY_INFO[type];
          const urgent = hasCompromisedEmails && URGENT_TYPES.includes(type);
          return (
            <Link
              key={type}
              href={`/generate?type=${type}&from=scan&scanId=${scanId}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  {info.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{t(info.labelKey)}</p>
                    {urgent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                        {t("scan.report.urgent")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t(info.descKey)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-blue-600 flex-shrink-0">
                {t("scan.report.generate")} <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
