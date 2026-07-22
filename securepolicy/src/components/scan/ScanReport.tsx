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

export function ScanReport({ report }: { report: AttackSurfaceReport }) {
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
            Diagnostiqué le {new Date(report.created_at).toLocaleDateString("fr-CA", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" onClick={() => setRescanning(true)}>
          <RefreshCw size={14} />
          Nouveau scan
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
            <h3 className="text-sm font-semibold text-gray-900">SSL</h3>
          </div>
          {report.ssl.hasSSL ? (
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              <span>Grade : <strong>{report.ssl.grade ?? "N/A"}</strong></span>
              <span>
                {report.ssl.expired
                  ? "Certificat expiré"
                  : report.ssl.daysUntilExpiry !== null
                  ? `Expire dans ${report.ssl.daysUntilExpiry} jours`
                  : "Expiration inconnue"}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">{report.ssl.error || "Aucun certificat SSL détecté"}</p>
          )}
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">Fuites de données</h3>
          </div>
          {report.emails_compromis.error ? (
            <p className="text-xs text-gray-400">{report.emails_compromis.error}</p>
          ) : (
            <p className="text-xs text-gray-600">
              <strong>{report.emails_compromis.compromisedCount}</strong> compte(s) compromis
            </p>
          )}
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={15} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">DNS</h3>
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
            <h3 className="text-sm font-semibold text-gray-900">Sous-domaines</h3>
          </div>
          <p className="text-xs text-gray-600">
            <strong>{report.subdomains.count}</strong> sous-domaine(s) exposé(s)
          </p>
        </Card>
      </div>

      {/* Findings */}
      <Card className="mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Constats du diagnostic</h2>
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
