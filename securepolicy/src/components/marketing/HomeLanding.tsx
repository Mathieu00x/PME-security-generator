import Link from "next/link";
import {
  Shield, CheckCircle, Check, Radar, AlertTriangle,
  Target, Map, FileBarChart, Building2, Scale, ShieldCheck, Award,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PublicScanForm } from "@/components/marketing/PublicScanForm";
import { getT, Lang } from "@/lib/i18n";

const PORTFOLIO_PREVIEW = [
  { name: "Atelier Demo Inc.", score: 72, status: "actions", count: 3 },
  { name: "Maple Dental", score: 84, status: "healthy", count: 0 },
  { name: "ABC Construction", score: 61, status: "actions", count: 5 },
  { name: "Northstar Legal", score: 77, status: "actions", count: 2 },
];

// Locale-routed (/ with lang="en", /fr with lang="fr") rather than
// client-toggled — see src/lib/i18n.ts for why.
export function HomeLanding({ lang }: { lang: Lang }) {
  const t = getT(lang);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} canonicalPath="/" />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Shield size={12} />
          {t("hero.badge")}
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          {t("hero.title1")}<br />
          {t("hero.title2")}{" "}
          <span className="text-blue-600">{t("hero.title3")}</span>
        </h1>
        <p className="text-xl font-semibold text-blue-600 tracking-tight mb-4">
          {t("hero.tagline")}
        </p>
        <p className="text-lg font-medium text-gray-700 max-w-2xl mx-auto mb-3">
          {t("hero.leadLine")}
        </p>
        <p className="text-base text-gray-500 max-w-2xl mx-auto mb-10">
          {t("hero.subtitle")}
        </p>

        <div className="flex items-center justify-center gap-4 mb-12">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {t("hero.cta")}
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t("hero.demo")}
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-16 flex-wrap">
          <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> {t("hero.badge1")}</span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> {t("hero.badge2")}</span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> {t("hero.badge3")}</span>
        </div>

        {/* Real, functional scan — not a static mockup. Try it on a prospect's domain. */}
        <PublicScanForm lang={lang} />
      </section>

      {/* Standards */}
      <section className="border-y border-gray-100 py-10 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-gray-400 mb-8">
            {t("standards.title")}
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap text-sm font-semibold text-gray-400">
            {["NIST CSF", "CIS Controls", "ISO 27001", "SOC 2", "Loi 25 (Québec)", "PIPEDA"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Turn a scan into a contract — the MSP's #1 use case for an
          external scan is prospecting, not just servicing existing
          clients, so this gets its own prominent section. */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("prospecting.title")}</h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-12">{t("prospecting.subtitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {([
              { icon: Radar, key: "step1" },
              { icon: FileBarChart, key: "step2" },
              { icon: Award, key: "step3" },
            ] as const).map(({ icon: Icon, key }) => (
              <div key={key} className="bg-gray-50 rounded-2xl p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">{t(`prospecting.${key}.title`)}</p>
                <p className="text-sm text-gray-500">{t(`prospecting.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">{t("problem.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{t(`problem.point${n}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — workflow */}
      <section id="how-it-works" className="py-24 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("how.title")}</h2>
          <p className="text-gray-500 mb-16">{t("how.subtitle")}</p>

          <div className="grid grid-cols-2 gap-8">
            {[
              { num: "1", icon: <Radar size={26} className="text-blue-600" />, titleKey: "how.step1.title", descKey: "how.step1.desc" },
              { num: "2", icon: <Target size={26} className="text-blue-600" />, titleKey: "how.step2.title", descKey: "how.step2.desc" },
              { num: "3", icon: <Map size={26} className="text-blue-600" />, titleKey: "how.step3.title", descKey: "how.step3.desc" },
              { num: "4", icon: <FileBarChart size={26} className="text-blue-600" />, titleKey: "how.step4.title", descKey: "how.step4.desc" },
            ].map(({ num, icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex items-start gap-4 text-left bg-white rounded-2xl p-6 border border-gray-100">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                    {icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {num}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t(titleKey)}</h3>
                  <p className="text-sm text-gray-500">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Canadian differentiator */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-3xl mb-3">🇨🇦</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("canadian.title")}</h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">{t("canadian.subtitle")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
            <div className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">{t("canadian.loi25.label")}</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mb-3">64%</p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-blue-600" style={{ width: "64%" }} />
              </div>
              <p className="text-xs text-gray-500">{t("canadian.loi25.detail")}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">{t("canadian.pipeda.label")}</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mb-3">72%</p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-blue-600" style={{ width: "72%" }} />
              </div>
              <p className="text-xs text-gray-500">{t("canadian.pipeda.detail")}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 italic">{t("canadian.disclaimer")}</p>
        </div>
      </section>

      {/* MSP workspace */}
      <section className="py-24 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("workspace.title")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t("workspace.subtitle")}</p>
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
                    {client.status === "healthy" ? t("workspace.healthy") : t("workspace.actionsCount", { count: client.count })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-gray-600">{t("workspace.closingLine")}</p>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">{t("features.title")}</h2>
          <p className="text-gray-500 text-center mb-12">{t("features.subtitle")}</p>
          <div className="grid grid-cols-2 gap-4">
            {(["1","2","3","4","5","6"] as const).map((n) => (
              <div key={n} className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-start gap-3">
                <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t(`features.${n}.title`)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t(`features.${n}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder — a security product with no face behind it is itself a
          credibility gap. Kept honest and minimal: no fabricated bio or
          photo beyond what's actually been provided. */}
      <section className="py-16 px-8">
        <div className="max-w-md mx-auto flex items-center gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            MJ
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t("founder.name")}</p>
            <p className="text-xs text-gray-500">{t("founder.role")}</p>
            <p className="text-xs text-gray-500 mt-1">{t("founder.note")}</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">{t("pricing.title")}</h2>
          <p className="text-gray-500 text-center mb-14">{t("pricing.subtitleBeta")}</p>

          <div className="grid grid-cols-1 max-w-sm mx-auto gap-5">
            {/* Paid plans (starter, pro, agency) are hidden while Stripe is
                in test mode during the beta — re-add them to this array
                once ready to accept real payments. */}
            {(["beta"] as ("starter" | "pro" | "agency" | "beta")[]).map((planKey) => {
              const isPopular = planKey === "pro";
              const isBeta = planKey === "beta";
              return (
                <div
                  key={planKey}
                  className={`relative flex flex-col rounded-2xl p-6 ${
                    isPopular
                      ? "bg-gray-900 text-white"
                      : isBeta
                      ? "bg-white border-2 border-dashed border-blue-300"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {t("pricing.pro.badge")}
                    </span>
                  )}
                  {isBeta && (
                    <span className="absolute -top-3 left-6 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {t("pricing.beta.badge")}
                    </span>
                  )}

                  <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${isPopular ? "text-blue-300" : "text-gray-500"}`}>
                    {t(`pricing.${planKey}.name`)}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-3xl font-extrabold">{t(`pricing.${planKey}.price`)}</span>
                    <span className={`text-sm mb-0.5 ${isPopular ? "text-gray-300" : "text-gray-400"}`}>
                      {t(`pricing.${planKey}.period`)}
                    </span>
                  </div>
                  <p className={`text-xs mb-5 ${isPopular ? "text-gray-300" : "text-gray-500"}`}>
                    {t(`pricing.${planKey}.desc`)}
                  </p>

                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {(["f1", "f2", "f3", "f4", "f5"] as const).map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-xs ${isPopular ? "text-gray-200" : "text-gray-700"}`}>
                        <Check size={13} className={`flex-shrink-0 mt-0.5 ${isPopular ? "text-blue-300" : "text-blue-600"}`} />
                        {t(`pricing.${planKey}.${f}`)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`block text-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isPopular ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {t(`pricing.${planKey}.cta`)}
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">{t("pricing.annualNoteBeta")}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("cta.title")}</h2>
          <p className="text-gray-500 mb-8">{t("cta.subtitle")}</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 text-lg"
          >
            <Radar size={20} />
            {t("cta.button")}
          </Link>
        </div>
      </section>

      <MarketingFooter lang={lang} />
    </div>
  );
}
