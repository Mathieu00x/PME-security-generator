import Link from "next/link";
import { Building2, AlertTriangle, Scale, ListChecks, Map, FileBarChart, CheckCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getT, Lang } from "@/lib/i18n";

const PORTFOLIO_PREVIEW = [
  { name: "Atelier Demo Inc.", score: 72, status: "actions", count: 3 },
  { name: "Maple Dental", score: 84, status: "healthy", count: 0 },
  { name: "ABC Construction", score: 61, status: "actions", count: 5 },
  { name: "Northstar Legal", score: 77, status: "actions", count: 2 },
];

const PILLAR_KEYS = ["assess", "remediate", "deliver"] as const;
const PILLAR_ICONS = [Scale, ListChecks, Map];
const CAPABILITY_KEYS = ["posture", "readiness", "tasks", "roadmap", "reports", "policies"] as const;

// Locale-routed (/for-msps + /fr/for-msps) — see src/lib/i18n.ts.
export function ForMspsLanding({ lang }: { lang: Lang }) {
  const t = getT(lang);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} canonicalPath="/for-msps" />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          {t("forMspsPage.badge")}
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-5">{t("forMspsPage.h1")}</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">{t("forMspsPage.subtitle")}</p>
        <Link
          href="/register"
          className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          {t("forMspsPage.cta")}
        </Link>
      </section>

      {/* Problem */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">{t("forMspsPage.problem.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{t(`forMspsPage.problem.point${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace preview */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("forMspsPage.workspace.title")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t("forMspsPage.workspace.subtitle")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {PORTFOLIO_PREVIEW.map((client) => (
              <div key={client.name} className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <Building2 size={14} className="text-gray-300" />
                  <span className="text-sm font-medium text-gray-800">{client.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-900">{client.score}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    client.status === "healthy" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {client.status === "healthy" ? t("forMspsPage.workspace.healthy") : t("forMspsPage.workspace.actionsCount", { count: client.count })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-gray-600">{t("forMspsPage.workspace.closingLine")}</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("forMspsPage.pillars.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PILLAR_KEYS.map((key, i) => {
              const Icon = PILLAR_ICONS[i];
              return (
                <div key={key} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={22} className="text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">{t(`forMspsPage.pillars.${key}.title`)}</p>
                  <p className="text-sm text-gray-500">{t(`forMspsPage.pillars.${key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("forMspsPage.capabilities.title")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CAPABILITY_KEYS.map((key) => (
              <div key={key} className="flex items-start gap-2 px-1">
                <CheckCircle size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{t(`forMspsPage.capabilities.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 text-center bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("forMspsPage.finalCta.title")}</h2>
          <p className="text-gray-500 mb-8">{t("forMspsPage.finalCta.subtitle")}</p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {t("forMspsPage.cta")}
          </Link>
        </div>
      </section>

      <MarketingFooter lang={lang} />
    </div>
  );
}
