import Link from "next/link";
import { Radar, ListChecks, Map, ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getT, Lang } from "@/lib/i18n";

const CHECK_KEYS = ["ssl", "email", "exposure", "assets", "headers", "fingerprint"] as const;
const PIPELINE_KEYS = ["scan", "findings", "tasks", "verified"] as const;
const PIPELINE_ICONS = [Radar, ListChecks, Map, ShieldCheck];

// Locale-routed (/external-security-assessment + /fr/...) — see
// src/lib/i18n.ts.
export function ExternalAssessmentLanding({ lang }: { lang: Lang }) {
  const t = getT(lang);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} canonicalPath="/external-security-assessment" />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          {t("externalPage.badge")}
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-5">{t("externalPage.h1")}</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">{t("externalPage.subtitle")}</p>
        <Link
          href="/register"
          className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          {t("externalPage.cta")}
        </Link>
      </section>

      {/* What we check */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("externalPage.whatWeCheck.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHECK_KEYS.map((key) => (
              <div key={key} className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-3">
                <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t(`externalPage.whatWeCheck.${key}.title`)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t(`externalPage.whatWeCheck.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the score works */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("externalPage.howItWorks.title")}</h2>
          <p className="text-gray-600 mb-4">{t("externalPage.howItWorks.body")}</p>
          <p className="text-xs text-gray-400 italic">{t("externalPage.howItWorks.disclaimer")}</p>
        </div>
      </section>

      {/* From scan to verified proof */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("externalPage.pipeline.title")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PIPELINE_KEYS.map((key, i) => {
              const Icon = PIPELINE_ICONS[i];
              return (
                <div key={key} className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={22} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{t(`externalPage.pipeline.${key}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{t("externalPage.limitations.title")}</h2>
          <div className="flex flex-col gap-3">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{t(`externalPage.limitations.point${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 text-center bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("externalPage.finalCta.title")}</h2>
          <p className="text-gray-500 mb-8">{t("externalPage.finalCta.subtitle")}</p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {t("externalPage.cta")}
          </Link>
        </div>
      </section>

      <MarketingFooter lang={lang} />
    </div>
  );
}
