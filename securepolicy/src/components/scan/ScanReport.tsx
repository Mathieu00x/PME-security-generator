"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Mail, Globe, Layers, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AttackSurfaceReport } from "@/types";
import { RiskGauge } from "@/components/scan/RiskGauge";
import { FindingCard } from "@/components/scan/FindingCard";
import { PolicyRecommendations } from "@/components/scan/PolicyRecommendations";
import { ScanForm } from "@/components/scan/ScanForm";
import { useLanguage } from "@/contexts/LanguageContext";

export function ScanReport({ report }: { report: AttackSurfaceReport }) {
  const { t, dateLocale } = useLanguage();
  const [rescanning, setRescanning] = useState(false);
  const prevIdRef = useRef(report.id);

  useEffect(() => {
    if (report.id !== prevIdRef.current) {
      setRescanning(false);
      prevIdRef.current = report.id;
    }
  }, [report.id]);

  if (rescanning) return <ScanForm />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{report.domain}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t("scan.report.scannedOn", {
              date: new Date(report.created_at).toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" }),
            })}
          </p>
        </div>
        <Button variant="outline" onClick={() => setRescanning(true)}>
          <RefreshCw size={14} />
          {t("scan.report.newScan")}
        </Button>
      </div>

      {/* Risk score */}
      <Card className="mb-4 flex items-center justify-center py-8">
        <RiskGauge score={report.risk_score} />
      </Card>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t("scan.report.ssl")}</h3>
          </div>
          {report.ssl.hasSSL ? (
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              <span>{t("scan.report.grade", { grade: report.ssl.grade ?? "N/A" })}</span>
              <span>
                {report.ssl.expired
                  ? t("scan.report.certExpired")
                  : report.ssl.daysUntilExpiry !== null
                  ? t("scan.report.expiresIn", { days: report.ssl.daysUntilExpiry })
                  : t("scan.report.expiryUnknown")}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">{report.ssl.error || t("scan.report.noSSL")}</p>
          )}
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t("scan.report.dataLeaks")}</h3>
          </div>
          {report.emails_compromis.error ? (
            <p className="text-xs text-gray-400">{report.emails_compromis.error}</p>
          ) : (
            <p className="text-xs text-gray-600">
              {t(report.emails_compromis.compromisedCount === 1 ? "scan.report.compromisedAccounts.one" : "scan.report.compromisedAccounts.other", {
                count: report.emails_compromis.compromisedCount,
              })}
            </p>
          )}
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t("scan.report.dns")}</h3>
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            {[
              { label: "SPF", ok: report.dns.hasSPF },
              { label: "DMARC", ok: report.dns.hasDMARC },
              { label: "MX", ok: report.dns.hasMX },
            ].map(({ label, ok }) => (
              <span key={label} className="flex items-center gap-1.5">
                {ok ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />}
                {label}
              </span>
            ))}
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t("scan.report.subdomains")}</h3>
          </div>
          <p className="text-xs text-gray-600">
            {t(report.subdomains.count === 1 ? "scan.report.subdomainsExposed.one" : "scan.report.subdomainsExposed.other", {
              count: report.subdomains.count,
            })}
          </p>
        </Card>
      </div>

      {/* Findings */}
      <Card className="mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">{t("scan.report.findings")}</h2>
        <div className="flex flex-col gap-2">
          {report.findings.map((finding, i) => (
            <FindingCard key={i} finding={finding} />
          ))}
        </div>
      </Card>

      {/* Recommended policies */}
      <PolicyRecommendations
        recommendedPolicies={report.recommended_policies}
        scanId={report.id}
        hasCompromisedEmails={report.emails_compromis.compromisedCount > 0}
      />
    </div>
  );
}
