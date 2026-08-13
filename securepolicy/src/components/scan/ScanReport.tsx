"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Mail, Globe, Layers, RefreshCw, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AttackSurfaceReport } from "@/types";
import { RiskGauge } from "@/components/scan/RiskGauge";
import { PriorityActions } from "@/components/scan/PriorityActions";
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

      {/* AI executive summary */}
      {report.executive_summary && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
          <p className="text-sm text-blue-900 leading-relaxed">{report.executive_summary}</p>
        </div>
      )}

      {/* Risk score */}
      <Card className="mb-4 flex items-center justify-center py-8">
        <RiskGauge score={report.risk_score} />
      </Card>

      <PriorityActions report={report} />

      {/* Score breakdown (absent on scans taken before this feature shipped) */}
      {report.score_breakdown?.ssl !== undefined && (
        <Card padding="sm" className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("scan.report.scoreBreakdown")}</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { label: t("scan.report.breakdown.ssl"), score: report.score_breakdown.ssl },
              { label: t("scan.report.breakdown.dnsEmail"), score: report.score_breakdown.dnsEmail },
              { label: t("scan.report.breakdown.dataExposure"), score: report.score_breakdown.dataExposure },
              { label: t("scan.report.breakdown.headers"), score: report.score_breakdown.headers },
            ].map(({ label, score }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-56 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${score >= 20 ? "bg-green-500" : score >= 12 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${(score / 25) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-900 w-14 text-right flex-shrink-0">
                  {t("scan.report.outOf25", { score })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
              { label: "DKIM", ok: report.dns.hasDKIM },
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

      {/* Security headers */}
      <Card padding="sm" className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">{t("scan.report.securityHeaders")}</h3>
        </div>
        {report.security_headers?.error ? (
          <p className="text-xs text-gray-400">{report.security_headers.error}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "HSTS", ok: report.security_headers.hasHSTS },
              { label: "CSP", ok: report.security_headers.hasCSP },
              { label: "X-Frame-Options", ok: report.security_headers.hasXFrameOptions },
              { label: "X-Content-Type-Options", ok: report.security_headers.hasXContentTypeOptions },
              { label: "Referrer-Policy", ok: report.security_headers.hasReferrerPolicy },
              { label: "Permissions-Policy", ok: report.security_headers.hasPermissionsPolicy },
            ].map(({ label, ok }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                {ok ? <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" /> : <XCircle size={12} className="text-red-400 flex-shrink-0" />}
                {label}
              </span>
            ))}
          </div>
        )}
      </Card>

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
