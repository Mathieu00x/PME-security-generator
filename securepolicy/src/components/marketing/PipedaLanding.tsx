import Link from "next/link";
import { ShieldCheck, ListChecks, Map, FileBarChart, CheckCircle, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getT, Lang } from "@/lib/i18n";

const PRINCIPLE_KEYS = [
  "accountability", "identifyingPurposes", "consent", "limitingCollection", "limitingUse",
  "accuracy", "safeguards", "openness", "individualAccess", "challengingCompliance",
] as const;
const PIPELINE_KEYS = ["assess", "tasks", "roadmap", "report"] as const;
const PIPELINE_ICONS = [ShieldCheck, ListChecks, Map, FileBarChart];

// Locale-routed (/pipeda with lang="en", /fr/pipeda with lang="fr") — see
// src/lib/i18n.ts. Mirrors Loi25Landing's structure exactly for consistency
// across money pages.
export function PipedaLanding({ lang }: { lang: Lang }) {
  const t = getT(lang);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} canonicalPath="/pipeda" />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          {t("pipedaPage.badge")}
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-5">{t("pipedaPage.h1")}</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">{t("pipedaPage.subtitle")}</p>
        <Link
          href="/register"
          className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          {t("pipedaPage.cta")}
        </Link>
      </section>

      {/* What we assess — 10 principles, condensed list (not 10 big cards) */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("pipedaPage.whatWeAssess.title")}</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {PRINCIPLE_KEYS.map((key, i) => (
              <div key={key} className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-b-0">
                <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">{i + 1}. {t(`pipedaPage.whatWeAssess.${key}`)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the readiness index works */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("pipedaPage.howItWorks.title")}</h2>
          <p className="text-gray-600 mb-4">{t("pipedaPage.howItWorks.body")}</p>
          <p className="text-xs text-gray-400 italic">{t("pipedaPage.howItWorks.disclaimer")}</p>
        </div>
      </section>

      {/* From gaps to proof */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("pipedaPage.pipeline.title")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PIPELINE_KEYS.map((key, i) => {
              const Icon = PIPELINE_ICONS[i];
              return (
                <div key={key} className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={22} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{t(`pipedaPage.pipeline.${key}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{t("pipedaPage.limitations.title")}</h2>
          <div className="flex flex-col gap-3">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{t(`pipedaPage.limitations.point${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 text-center bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("pipedaPage.finalCta.title")}</h2>
          <p className="text-gray-500 mb-8">{t("pipedaPage.finalCta.subtitle")}</p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {t("pipedaPage.cta")}
          </Link>
        </div>
      </section>

      <MarketingFooter lang={lang} />
    </div>
  );
}
