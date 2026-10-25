import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getT, localizedPath, Lang } from "@/lib/i18n";

// Shared across the home page and standalone marketing/SEO pages
// (/loi-25, /pipeda, etc.). No "use client" — these pages are now
// locale-routed (/loi-25 vs /fr/loi-25) rather than client-toggled, so the
// language switcher is a plain link to the sibling URL, not a content-only
// toggle: the URL and the rendered language always agree, which is what
// search engines (and the hreflang tags in each page's metadata) expect.
// `canonicalPath` is the English, unprefixed path for the current page
// (e.g. "/loi-25", or "/" for the home page) — used to build the link to
// its French counterpart.
export function MarketingNav({ lang, canonicalPath }: { lang: Lang; canonicalPath: string }) {
  const t = getT(lang);
  const home = localizedPath("/", lang);

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-6xl mx-auto">
      <Logo />
      <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
        <Link href={`${home}#features`} className="hover:text-gray-900">{t("nav.features")}</Link>
        <Link href={`${home}#how-it-works`} className="hover:text-gray-900">{t("nav.how")}</Link>
        <Link href={`${home}#pricing`} className="hover:text-gray-900">{t("nav.pricing")}</Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <Link
            href={localizedPath(canonicalPath, "fr")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              lang === "fr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            FR
          </Link>
          <Link
            href={localizedPath(canonicalPath, "en")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              lang === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            EN
          </Link>
        </div>
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
  );
}
