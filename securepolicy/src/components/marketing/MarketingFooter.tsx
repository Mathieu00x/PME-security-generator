import { getT, Lang } from "@/lib/i18n";

export function MarketingFooter({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <footer className="border-t border-gray-100 py-8 px-8 text-center text-sm text-gray-400">
      <p>{t("footer.copy")}</p>
    </footer>
  );
}
