import Link from "next/link";
import { Square, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { loi25Questions } from "@/lib/assessments/loi25-questions";
import { getT, Lang } from "@/lib/i18n";

// A real, usable checklist — not filler. Pulled directly from the same
// questions SecurePilot's own Loi 25 assessment asks (loi25-questions.ts),
// so the free content and the product never drift apart. Locale-routed
// (/guides/loi-25-checklist + /fr/guides/loi-25-checklist) — see
// src/lib/i18n.ts.
export function Loi25ChecklistGuide({ lang }: { lang: Lang }) {
  const t = getT(lang);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} canonicalPath="/guides/loi-25-checklist" />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-8 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          {t("loi25ChecklistPage.badge")}
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-5">{t("loi25ChecklistPage.h1")}</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t("loi25ChecklistPage.subtitle")}</p>
      </section>

      {/* The checklist itself */}
      <section className="py-8 px-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-8">
          {loi25Questions.sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {lang === "fr" ? section.title_fr : section.title_en}
              </h2>
              <div className="flex flex-col gap-3">
                {section.questions.map((q) => (
                  <div key={q.id} className="flex items-start gap-3">
                    <Square size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {lang === "fr" ? q.text_fr : q.text_en}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lang === "fr" ? q.help_fr : q.help_en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-8 pb-8">
        <p className="max-w-2xl mx-auto text-xs text-gray-400 italic text-center">
          {t("loi25ChecklistPage.disclaimer")}
        </p>
      </section>

      {/* CTA back to the product */}
      <section className="py-16 px-8 bg-gray-50 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-gray-700 font-medium mb-5">{t("loi25ChecklistPage.ctaLead")}</p>
          <Link
            href={lang === "fr" ? "/fr/loi-25" : "/loi-25"}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Sparkles size={16} />
            {t("loi25ChecklistPage.ctaButton")}
          </Link>
        </div>
      </section>

      <MarketingFooter lang={lang} />
    </div>
  );
}
