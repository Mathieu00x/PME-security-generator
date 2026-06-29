"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "fr";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navbar
    "nav.features": "Features",
    "nav.how": "How it works",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.start": "Start Free",

    // Hero
    "hero.badge": "AI-POWERED",
    "hero.title1": "Generate Professional",
    "hero.title2": "Security Policies in",
    "hero.title3": "Minutes",
    "hero.subtitle": "AI-powered security policy generator for small and medium businesses. Aligned with NIST, ISO 27001, and CIS Controls.",
    "hero.cta": "Start Free",
    "hero.demo": "See How It Works",
    "hero.badge1": "Aligned with NIST & ISO 27001",
    "hero.badge2": "Built for Canadian SMBs",
    "hero.badge3": "Loi 25 & PIPEDA ready",

    // Standards
    "standards.title": "Aligned with industry standards",

    // How it works
    "how.title": "How it works",
    "how.subtitle": "Simple steps to stronger security",
    "how.step1.title": "Create Your Account",
    "how.step1.desc": "Set up your company profile and security preferences.",
    "how.step2.title": "Answer Questions",
    "how.step2.desc": "Our AI asks tailored questions about your business.",
    "how.step3.title": "Generate & Download",
    "how.step3.desc": "Get professional policies and recommendations in minutes.",

    // Features
    "features.title": "Everything you need",
    "features.subtitle": "Professional-grade security documentation, simplified.",
    "features.1.title": "5 Policy Types",
    "features.1.desc": "Password, Backup, Incident Response, Acceptable Use, Remote Work",
    "features.2.title": "AI-Powered Generation",
    "features.2.desc": "Claude AI crafts policies tailored to your exact business context",
    "features.3.title": "Security Score",
    "features.3.desc": "Instant assessment with strengths, weaknesses, and recommendations",
    "features.4.title": "PDF Export",
    "features.4.desc": "Professional PDFs with your company logo, version number, and table of contents",
    "features.5.title": "Policy History",
    "features.5.desc": "Track all your generated policies with versioning and update history",
    "features.6.title": "Loi 25 & PIPEDA Ready",
    "features.6.desc": "Policies aligned with Canadian privacy laws and SMB compliance needs",

    // CTA
    "cta.title": "Ready to secure your business?",
    "cta.subtitle": "Generate your first professional security policy in under 10 minutes.",
    "cta.button": "Start Free — Takes 10 minutes",

    // Footer
    "footer.copy": "© 2026 SecurePolicy. Built for Canadian SMBs.",
  },

  fr: {
    // Navbar
    "nav.features": "Fonctionnalités",
    "nav.how": "Comment ça marche",
    "nav.pricing": "Tarification",
    "nav.login": "Connexion",
    "nav.start": "Commencer gratuitement",

    // Hero
    "hero.badge": "PROPULSÉ PAR L'IA",
    "hero.title1": "Générez des politiques de",
    "hero.title2": "sécurité professionnelles en",
    "hero.title3": "minutes",
    "hero.subtitle": "Générateur de politiques de cybersécurité propulsé par l'IA pour les PME. Aligné avec NIST, ISO 27001 et les contrôles CIS.",
    "hero.cta": "Commencer gratuitement",
    "hero.demo": "Voir comment ça marche",
    "hero.badge1": "Aligné avec NIST & ISO 27001",
    "hero.badge2": "Conçu pour les PME canadiennes",
    "hero.badge3": "Conforme à la Loi 25 & PIPEDA",

    // Standards
    "standards.title": "Aligné avec les standards de l'industrie",

    // How it works
    "how.title": "Comment ça marche",
    "how.subtitle": "Des étapes simples vers une meilleure sécurité",
    "how.step1.title": "Créez votre compte",
    "how.step1.desc": "Configurez le profil de votre entreprise et vos préférences de sécurité.",
    "how.step2.title": "Répondez aux questions",
    "how.step2.desc": "Notre IA pose des questions adaptées à votre entreprise.",
    "how.step3.title": "Générez et téléchargez",
    "how.step3.desc": "Obtenez des politiques professionnelles et des recommandations en minutes.",

    // Features
    "features.title": "Tout ce dont vous avez besoin",
    "features.subtitle": "Documentation de sécurité professionnelle, simplifiée.",
    "features.1.title": "5 types de politiques",
    "features.1.desc": "Mots de passe, Sauvegardes, Réponse aux incidents, Utilisation acceptable, Télétravail",
    "features.2.title": "Génération par IA",
    "features.2.desc": "Claude AI crée des politiques adaptées au contexte exact de votre entreprise",
    "features.3.title": "Score de sécurité",
    "features.3.desc": "Évaluation instantanée avec forces, faiblesses et recommandations",
    "features.4.title": "Export PDF",
    "features.4.desc": "PDFs professionnels avec votre logo, numéro de version et table des matières",
    "features.5.title": "Historique des politiques",
    "features.5.desc": "Suivez toutes vos politiques générées avec versionnement et historique",
    "features.6.title": "Conforme Loi 25 & PIPEDA",
    "features.6.desc": "Politiques alignées avec les lois canadiennes sur la vie privée",

    // CTA
    "cta.title": "Prêt à sécuriser votre entreprise ?",
    "cta.subtitle": "Générez votre première politique de sécurité professionnelle en moins de 10 minutes.",
    "cta.button": "Commencer gratuitement — 10 minutes",

    // Footer
    "footer.copy": "© 2026 SecurePolicy. Conçu pour les PME canadiennes.",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("sp-lang") as Lang | null;
    if (saved === "en" || saved === "fr") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("sp-lang", l);
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
