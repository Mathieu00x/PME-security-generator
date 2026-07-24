"use client";
import Link from "next/link";
import { Shield, FileText, TrendingUp, Download, CheckCircle, Check, Radar, BarChart3, AlertCircle, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-6xl mx-auto">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <Link href="#features" className="hover:text-gray-900">{t("nav.features")}</Link>
          <Link href="#how-it-works" className="hover:text-gray-900">{t("nav.how")}</Link>
          <Link href="#pricing" className="hover:text-gray-900">{t("nav.pricing")}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            {t("nav.login")}
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("nav.start")}
          </Link>
        </div>
      </nav>

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
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
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

        {/* Preview card — scan result */}
        <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl p-6 text-left">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radar size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{t("hero.preview.domain")}</span>
            </div>
            <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
              {t("hero.preview.risk")}
            </span>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">{t("hero.preview.score")}</span>
              <span className="text-xs font-bold text-gray-900">68 / 100</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-orange-400" style={{ width: "68%" }} />
            </div>
          </div>

          {/* Findings */}
          <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-gray-700">{t("hero.preview.finding1")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle size={13} className="text-orange-400 flex-shrink-0" />
              <span className="text-gray-700">{t("hero.preview.finding2")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{t("hero.preview.finding3")}</span>
            </div>
          </div>
        </div>
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

      {/* How it works — 4 steps */}
      <section id="how-it-works" className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("how.title")}</h2>
          <p className="text-gray-500 mb-16">{t("how.subtitle")}</p>

          <div className="grid grid-cols-2 gap-8">
            {[
              {
                num: "1",
                icon: <Radar size={26} className="text-blue-600" />,
                titleKey: "how.step1.title",
                descKey: "how.step1.desc",
              },
              {
                num: "2",
                icon: <BarChart3 size={26} className="text-blue-600" />,
                titleKey: "how.step2.title",
                descKey: "how.step2.desc",
              },
              {
                num: "3",
                icon: <FileText size={26} className="text-blue-600" />,
                titleKey: "how.step3.title",
                descKey: "how.step3.desc",
              },
              {
                num: "4",
                icon: <Download size={26} className="text-blue-600" />,
                titleKey: "how.step4.title",
                descKey: "how.step4.desc",
              },
            ].map(({ num, icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex items-start gap-4 text-left bg-gray-50 rounded-2xl p-6">
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

      {/* Features */}
      <section id="features" className="py-24 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">{t("features.title")}</h2>
          <p className="text-gray-500 text-center mb-12">{t("features.subtitle")}</p>
          <div className="grid grid-cols-2 gap-4">
            {(["1","2","3","4","5","6"] as const).map((n) => (
              <div key={n} className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-3">
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

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8">
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
      <section className="py-24 px-8 text-center bg-gray-50">
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8 text-center text-sm text-gray-400">
        <p>{t("footer.copy")}</p>
      </footer>
    </div>
  );
}
