import Link from "next/link";
import { ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { Framework, Policy } from "@/types";

const FRAMEWORKS = [
  {
    id: "iso27001",
    complianceKey: "ISO27001",
    name: "ISO 27001",
    badge: "bg-green-50 text-green-700 border-green-200",
    tagline: "Information Security Management System",
    description:
      "International standard defining requirements for establishing, implementing, maintaining and improving an information security management system (ISMS). Recognized worldwide and frequently required in enterprise RFPs and procurement processes.",
    relevantFor: ["Formal certification", "Enterprise clients", "Government procurement"],
    policies: ["Password Policy", "Access Control", "Incident Response", "Business Continuity"],
    effort: "High",
    effortColor: "text-red-600",
  },
  {
    id: "nist",
    complianceKey: "NIST",
    name: "NIST CSF",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    tagline: "National Institute of Standards and Technology Cybersecurity Framework",
    description:
      "Voluntary U.S. framework organized around 5 functions: Identify, Protect, Detect, Respond, Recover. Widely adopted in North America, particularly by SMBs that want to structure their security posture without pursuing formal certification.",
    relevantFor: ["North American SMBs", "Financial sector", "Critical infrastructure"],
    policies: ["Backup Policy", "Incident Response Plan", "Access Management"],
    effort: "Medium",
    effortColor: "text-yellow-600",
  },
  {
    id: "cis",
    complianceKey: "CIS",
    name: "CIS Controls",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    tagline: "Center for Internet Security — 18 prioritized controls",
    description:
      "18 concrete, prioritized controls to reduce cyber risk. Ideal for SMBs getting started: begin with Implementation Group 1 (IG1) controls to cover 85% of common attacks with minimal effort and resources.",
    relevantFor: ["SMBs getting started", "Quick security wins", "Limited IT resources"],
    policies: ["Asset Inventory", "Secure Configuration", "Privileged Access Control"],
    effort: "Low to Medium",
    effortColor: "text-green-600",
  },
  {
    id: "soc2",
    complianceKey: "SOC2",
    name: "SOC 2",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Service Organization Control — Trust, Security, Availability",
    description:
      "Audit report based on 5 Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy. Highly requested by SaaS clients and technology companies to demonstrate operational rigor to their customers.",
    relevantFor: ["SaaS companies", "Cloud service providers", "U.S. enterprise customers"],
    policies: ["Logical Access Control", "Continuous Monitoring", "Change Management"],
    effort: "High",
    effortColor: "text-red-600",
  },
  {
    id: "loi25",
    complianceKey: "Loi25",
    name: "Law 25",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    tagline: "An Act to modernize legislative provisions as regards the protection of personal information (Quebec)",
    description:
      "Quebec law in force since 2022 that strengthens the protection of personal information. It requires the appointment of a Privacy Officer, Privacy Impact Assessments (PIAs), and incident notification within 72 hours.",
    relevantFor: ["Quebec-based businesses", "Any organization collecting data in Quebec"],
    policies: ["Privacy Policy", "Incident Response Plan", "BYOD Policy"],
    effort: "Medium",
    effortColor: "text-yellow-600",
  },
  {
    id: "rgpd",
    complianceKey: "RGPD",
    name: "GDPR",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    tagline: "General Data Protection Regulation (Europe)",
    description:
      "European regulation applicable to any organization processing personal data of EU residents. Requires consent, data minimization, appropriate security measures, and breach notification within 72 hours.",
    relevantFor: ["European customers", "International commerce", "Organizations with EU operations"],
    policies: ["Privacy Policy", "Data Retention Policy", "Incident Response Plan"],
    effort: "High",
    effortColor: "text-red-600",
  },
];

export default async function FrameworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: frameworkRows }, { data: policyRows }] = await Promise.all([
    supabase.from("frameworks").select("*"),
    supabase.from("policies").select("id, title, framework_versions, security_score").eq("user_id", user!.id),
  ]);

  const versionByKey: Record<string, Framework> = {};
  (frameworkRows as Framework[] || []).forEach((f) => { versionByKey[f.id] = f; });

  const policies = (policyRows as Pick<Policy, "id" | "title" | "framework_versions" | "security_score">[]) || [];

  const affectedByKey: Record<string, { id: string; title: string; oldVersion: string }[]> = {};
  policies.forEach((p) => {
    Object.entries(p.framework_versions || {}).forEach(([key, oldVersion]) => {
      const current = versionByKey[key]?.current_version;
      if (current && current !== oldVersion) {
        affectedByKey[key] = affectedByKey[key] || [];
        affectedByKey[key].push({ id: p.id, title: p.title, oldVersion });
      }
    });
  });

  const totalAffected = new Set(Object.values(affectedByKey).flat().map((a) => a.id)).size;

  // Multi-framework dashboard: average gap-analysis compliance % per framework,
  // across every policy whose complianceMapping references it.
  const complianceStats: Record<string, { policyCount: number; avgCompliance: number | null }> = {};
  FRAMEWORKS.forEach((fw) => {
    const covering = policies.filter((p) => (p.security_score?.complianceMapping as Record<string, string[]> | undefined)?.[fw.complianceKey]?.length);
    const withGap = covering.filter((p) => p.security_score?.gapAnalysis);
    const avgCompliance = withGap.length
      ? Math.round(withGap.reduce((sum, p) => sum + (p.security_score!.gapAnalysis!.compliancePercentage), 0) / withGap.length)
      : null;
    complianceStats[fw.complianceKey] = { policyCount: covering.length, avgCompliance };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Frameworks Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Compliance coverage across every framework your policies are aligned with.
        </p>
      </div>

      {/* Multi-framework dashboard */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {FRAMEWORKS.map((fw) => {
          const stat = complianceStats[fw.complianceKey];
          const outdated = (affectedByKey[fw.complianceKey] || []).length > 0;
          const pct = stat.avgCompliance;
          const meterColor = pct === null ? "#e5e7eb" : pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";

          return (
            <div key={fw.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-900">{fw.name}</span>
                {outdated && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Outdated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct ?? 0}%`, background: meterColor }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 tabular-nums w-9 text-right">
                  {pct === null ? "—" : `${pct}%`}
                </span>
              </div>

              <p className="text-[10px] text-gray-400">
                {stat.policyCount} {stat.policyCount === 1 ? "policy" : "policies"}
                {versionByKey[fw.complianceKey] ? ` · v${versionByKey[fw.complianceKey].current_version}` : ""}
              </p>
            </div>
          );
        })}
      </div>

      {totalAffected > 0 && (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {totalAffected} {totalAffected === 1 ? "policy references" : "policies reference"} an outdated framework revision
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              A framework you&apos;re aligned with has been updated since your policy was generated. Regenerate the affected policies below to bring them current.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {FRAMEWORKS.map((fw) => {
          const tracked = versionByKey[fw.complianceKey];
          const affected = affectedByKey[fw.complianceKey] || [];
          return (
            <Card key={fw.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${fw.badge}`}>
                      {fw.name}
                    </span>
                    <span className="text-xs text-gray-400">{fw.tagline}</span>
                    {tracked && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Current version: {tracked.current_version}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{fw.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Relevant for
                      </p>
                      <ul className="flex flex-col gap-1">
                        {fw.relevantFor.map((r, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Related policies
                      </p>
                      <ul className="flex flex-col gap-1">
                        {fw.policies.map((p, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {affected.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        {affected.length} of your policies reference an older revision:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {affected.map((a) => (
                          <div key={a.id} className="flex items-center justify-between gap-3">
                            <span className="text-xs text-amber-800">
                              {a.title} <span className="text-amber-500">(v{a.oldVersion})</span>
                            </span>
                            <Link
                              href={`/generate?regenerate=${a.id}`}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline flex-shrink-0"
                            >
                              <RefreshCw size={11} /> Update
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Effort</p>
                    <p className={`text-xs font-semibold ${fw.effortColor}`}>{fw.effort}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <ExternalLink size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">SecurePilot automatically aligns your policies</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Every generated policy is automatically mapped to applicable frameworks (NIST, CIS, ISO 27001, SOC 2, Law 25, GDPR) based on your company context, and flagged here if the underlying standard is updated.
          </p>
        </div>
      </div>
    </div>
  );
}
