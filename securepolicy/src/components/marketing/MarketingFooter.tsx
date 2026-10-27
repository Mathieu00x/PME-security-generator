import Link from "next/link";
import { getT, Lang } from "@/lib/i18n";

export function MarketingFooter({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <footer className="border-t border-gray-100 py-8 px-8 text-center text-sm text-gray-400">
      <p className="mb-3">{t("footer.copy")}</p>
      <div className="flex items-center justify-center gap-4 text-xs">
        <Link href="/privacy" className="hover:text-gray-600">{t("footer.privacy")}</Link>
        <span className="text-gray-200">|</span>
        <Link href="/terms" className="hover:text-gray-600">{t("footer.terms")}</Link>
        <span className="text-gray-200">|</span>
        {/* Works for visitors who only used the anonymous scan and never
            created an account — "contact us via your account" (the old
            wording) gave them no way to reach anyone. */}
        <a href="mailto:privacy@securepilot.ca" className="hover:text-gray-600">privacy@securepilot.ca</a>
      </div>
    </footer>
  );
}
