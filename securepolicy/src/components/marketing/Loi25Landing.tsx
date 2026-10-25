import Link from "next/link";
import { Scale, ListChecks, Map, FileBarChart, CheckCircle, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getT, Lang } from "@/lib/i18n";

const SECTION_KEYS = ["governance", "incidents", "retention", "pia", "rights", "consent"] as const;
const PIPELINE_KEYS = ["assess", "tasks", "roadmap", "report"] as const;
const PIPELINE_ICONS = [Scale, ListChecks, Map, FileBarChart];

// Locale-routed (rendered once for /loi-25 with lang="en", once for
// /fr/loi-25 with lang="fr") rather than client-toggled — see
// src/lib/i18n.ts for why.
export function Loi25Landing({ lang }: { lang: Lang }) {
  const t = getT(lang);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} canonicalPath="/loi-25" />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          {t("loi25Page.badge")}
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-5">{t("loi25Page.h1")}</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">{t("loi25Page.subtitle")}</p>
        <Link
          href="/register"
          className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          {t("loi25Page.cta")}
        </Link>
      </section>

      {/* What we assess */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("loi25Page.whatWeAssess.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SECTION_KEYS.map((key) => (
              <div key={key} className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-3">
                <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t(`loi25Page.whatWeAssess.${key}.title`)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t(`loi25Page.whatWeAssess.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the readiness index works */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("loi25Page.howItWorks.title")}</h2>
          <p className="text-gray-600 mb-4">{t("loi25Page.howItWorks.body")}</p>
          <p className="text-xs text-gray-400 italic">{t("loi25Page.howItWorks.disclaimer")}</p>
        </div>
      </section>

      {/* From gaps to proof */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("loi25Page.pipeline.title")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PIPELINE_KEYS.map((key, i) => {
              const Icon = PIPELINE_ICONS[i];
              return (
                <div key={key} className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={22} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{t(`loi25Page.pipeline.${key}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{t("loi25Page.limitations.title")}</h2>
          <div className="flex flex-col gap-3">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{t(`loi25Page.limitations.point${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 text-center bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("loi25Page.finalCta.title")}</h2>
          <p className="text-gray-500 mb-8">{t("loi25Page.finalCta.subtitle")}</p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {t("loi25Page.cta")}
          </Link>
        </div>
      </section>

      <MarketingFooter lang={lang} />
    </div>
  );
}
