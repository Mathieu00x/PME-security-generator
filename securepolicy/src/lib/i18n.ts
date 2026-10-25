import { translations, Lang } from "@/lib/translations";

export type { Lang };
type TParams = Record<string, string | number>;

// Server-safe counterpart to useLanguage()'s t() — for the public marketing
// pages that are now locale-routed (/loi-25 vs /fr/loi-25) rather than
// client-toggled, so the server can render the correct language on first
// paint with no client JS/hydration involved, and search engines see
// distinct, correctly-languaged URLs instead of one URL whose content
// depends on a client-side localStorage/navigator.language check. Reuses
// the same `translations` dictionary as the client Provider — one source
// of strings, two ways to read them.
export function getT(lang: Lang) {
  return function t(key: string, params?: TParams): string {
    let str = translations[lang][key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };
}

export function otherLang(lang: Lang): Lang {
  return lang === "en" ? "fr" : "en";
}

// Maps a canonical (English, unprefixed) marketing path to its French
// counterpart under /fr — e.g. "/loi-25" -> "/fr/loi-25", "/" -> "/fr".
export function localizedPath(canonicalPath: string, lang: Lang): string {
  if (lang === "en") return canonicalPath;
  return canonicalPath === "/" ? "/fr" : `/fr${canonicalPath}`;
}
