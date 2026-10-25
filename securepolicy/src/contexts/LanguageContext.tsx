"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Lang } from "@/lib/translations";

type TParams = Record<string, string | number>;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: TParams) => string;
  dateLocale: string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dateLocale: "en-CA",
});


export { translations };


export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("sp-lang") as Lang | null;
    if (saved === "en" || saved === "fr") {
      setLangState(saved);
    } else {
      const browserLang = navigator.language?.startsWith("fr") ? "fr" : "en";
      setLangState(browserLang);
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("sp-lang", l);
  }

  function t(key: string, params?: TParams): string {
    let str = translations[lang][key] ?? translations["en"][key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }

  const dateLocale = lang === "fr" ? "fr-CA" : "en-CA";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dateLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
