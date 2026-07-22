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
    "hero.badge": "ALL-IN-ONE CYBERSECURITY PLATFORM",
    "hero.tagline": "Scan. Secure. Comply.",
    "hero.title1": "The cybersecurity platform",
    "hero.title2": "for Canadian",
    "hero.title3": "IT consultants",
    "hero.subtitle": "Scan your clients' attack surface, generate compliance policies, export professional reports — in 20 minutes per client.",
    "hero.cta": "Scan my domain",
    "hero.demo": "See how it works",
    "hero.badge1": "Loi 25 & PIPEDA",
    "hero.badge2": "MSPs & IT Consultants",
    "hero.badge3": "NIST · CIS · ISO 27001",

    // Preview card
    "hero.preview.domain": "acme-corp.com",
    "hero.preview.score": "Risk Score",
    "hero.preview.risk": "MEDIUM Risk",
    "hero.preview.finding1": "3 compromised emails detected (HIBP)",
    "hero.preview.finding2": "SSL expires in 12 days",
    "hero.preview.finding3": "SPF & DMARC configured",

    // Standards
    "standards.title": "Aligned with industry standards",

    // How it works
    "how.title": "A complete workflow in 4 steps",
    "how.subtitle": "From diagnosis to delivery, everything is integrated.",
    "how.step1.title": "Attack Surface Diagnostic",
    "how.step1.desc": "Passive scan of your domain: SSL, DNS, compromised emails (HIBP), exposed subdomains.",
    "how.step2.title": "Security Score + NIST/CIS/ISO",
    "how.step2.desc": "Instant score with compliance control mapping and gap identification.",
    "how.step3.title": "Automatic Policy Generation",
    "how.step3.desc": "AI-generated professional policies, tailored to the detected vulnerabilities.",
    "how.step4.title": "Multi-format Export",
    "how.step4.desc": "PDF, Word, Confluence and Notion — ready to deliver to your clients or auditors.",

    // Features
    "features.title": "Everything you need",
    "features.subtitle": "Professional cybersecurity, simplified for consultants and MSPs.",
    "features.1.title": "Real-time Domain Scan",
    "features.1.desc": "SSL, DNS, HIBP, subdomains — complete analysis with no extra tools",
    "features.2.title": "Instant Risk Score",
    "features.2.desc": "0–100 score with LOW/MEDIUM/HIGH risk level and improvement areas",
    "features.3.title": "5 Policy Types",
    "features.3.desc": "Password, Backup, Incident Response, Acceptable Use, Remote Work",
    "features.4.title": "NIST · CIS · ISO 27001 Alignment",
    "features.4.desc": "Each policy mapped to compliance controls with precise references",
    "features.5.title": "PDF + Word Export",
    "features.5.desc": "Professional documents with logo, version, table of contents — ready to deliver",
    "features.6.title": "Loi 25 & PIPEDA Ready",
    "features.6.desc": "Policies aligned with Canadian privacy laws and SMB compliance needs",

    // Pricing
    "pricing.title": "Simple, transparent pricing",
    "pricing.subtitle": "No hidden fees. Cancel anytime.",
    "pricing.consultant.name": "Consultant",
    "pricing.consultant.price": "$79",
    "pricing.consultant.period": "/month",
    "pricing.consultant.desc": "For IT professionals and independent consultants",
    "pricing.consultant.cta": "Get started",
    "pricing.consultant.f1": "Unlimited domain scans",
    "pricing.consultant.f2": "Unlimited policy generation",
    "pricing.consultant.f3": "PDF + Word export",
    "pricing.consultant.f4": "Security score & NIST/CIS/ISO mapping",
    "pricing.consultant.f5": "Best practices & action checklist",
    "pricing.consultant.f6": "Loi 25 & PIPEDA ready",
    "pricing.agency.name": "Agency",
    "pricing.agency.badge": "Most popular",
    "pricing.agency.price": "$199",
    "pricing.agency.period": "/month",
    "pricing.agency.desc": "For MSPs and IT agencies managing multiple clients",
    "pricing.agency.cta": "Get started",
    "pricing.agency.f1": "Everything in Consultant",
    "pricing.agency.f2": "Up to 10 client profiles",
    "pricing.agency.f3": "Custom branding (client logo)",
    "pricing.agency.f4": "Policy version management",
    "pricing.agency.f5": "Multi-client dashboard",
    "pricing.agency.f6": "Priority support",

    // CTA
    "cta.title": "Start your first diagnostic",
    "cta.subtitle": "Scan your domain and get your first compliance policies in under 20 minutes.",
    "cta.button": "Scan my domain — Free",

    // Footer
    "footer.copy": "© 2026 SecurePilot. Built for Canadian IT consultants & MSPs.",
  },

  fr: {
    // Navbar
    "nav.features": "Fonctionnalités",
    "nav.how": "Comment ça marche",
    "nav.pricing": "Tarification",
    "nav.login": "Connexion",
    "nav.start": "Commencer gratuitement",

    // Hero
    "hero.badge": "PLATEFORME CYBERSÉCURITÉ TOUT-EN-UN",
    "hero.tagline": "Scan. Secure. Comply.",
    "hero.title1": "La plateforme de cybersécurité",
    "hero.title2": "pour consultants IT",
    "hero.title3": "canadiens",
    "hero.subtitle": "Scannez la surface d'attaque de vos clients, générez leurs politiques de conformité, exportez des rapports professionnels — en 20 minutes par client.",
    "hero.cta": "Scanner mon domaine",
    "hero.demo": "Voir comment ça marche",
    "hero.badge1": "Loi 25 & PIPEDA",
    "hero.badge2": "MSP & Consultants IT",
    "hero.badge3": "NIST · CIS · ISO 27001",

    // Preview card
    "hero.preview.domain": "acme-corp.com",
    "hero.preview.score": "Score de risque",
    "hero.preview.risk": "Risque MOYEN",
    "hero.preview.finding1": "3 emails compromis détectés (HIBP)",
    "hero.preview.finding2": "SSL expire dans 12 jours",
    "hero.preview.finding3": "SPF & DMARC configurés",

    // Standards
    "standards.title": "Aligné avec les standards de l'industrie",

    // How it works
    "how.title": "Un flux complet en 4 étapes",
    "how.subtitle": "Du diagnostic à la livraison, tout est intégré.",
    "how.step1.title": "Diagnostic de surface d'attaque",
    "how.step1.desc": "Scan passif de votre domaine : SSL, DNS, emails compromis (HIBP), sous-domaines exposés.",
    "how.step2.title": "Score de sécurité + NIST/CIS/ISO",
    "how.step2.desc": "Score instantané avec mapping des contrôles de conformité et identification des écarts.",
    "how.step3.title": "Génération automatique de politiques",
    "how.step3.desc": "Politiques professionnelles générées par IA, adaptées aux vulnérabilités détectées.",
    "how.step4.title": "Export multi-format",
    "how.step4.desc": "PDF, Word, Confluence et Notion — prêts à livrer à vos clients ou auditeurs.",

    // Features
    "features.title": "Tout ce dont vous avez besoin",
    "features.subtitle": "Cybersécurité professionnelle, simplifiée pour les consultants et MSP.",
    "features.1.title": "Scan de domaine en temps réel",
    "features.1.desc": "SSL, DNS, HIBP, sous-domaines — analyse complète sans outil supplémentaire",
    "features.2.title": "Score de risque instantané",
    "features.2.desc": "Score 0–100 avec niveau FAIBLE/MOYEN/ÉLEVÉ et axes d'amélioration",
    "features.3.title": "5 types de politiques",
    "features.3.desc": "Mots de passe, Sauvegarde, Réponse aux incidents, Utilisation acceptable, Télétravail",
    "features.4.title": "Alignement NIST · CIS · ISO 27001",
    "features.4.desc": "Chaque politique mappée aux contrôles de conformité avec références précises",
    "features.5.title": "Export PDF + Word",
    "features.5.desc": "Documents professionnels avec logo, version, table des matières — prêts à livrer",
    "features.6.title": "Conforme Loi 25 & PIPEDA",
    "features.6.desc": "Politiques alignées avec les lois canadiennes sur la vie privée",

    // Pricing
    "pricing.title": "Tarification simple et transparente",
    "pricing.subtitle": "Sans frais cachés. Annulable en tout temps.",
    "pricing.consultant.name": "Consultant",
    "pricing.consultant.price": "79 $",
    "pricing.consultant.period": "/mois",
    "pricing.consultant.desc": "Pour les professionnels TI et consultants indépendants",
    "pricing.consultant.cta": "Commencer",
    "pricing.consultant.f1": "Scans de domaine illimités",
    "pricing.consultant.f2": "Génération illimitée de politiques",
    "pricing.consultant.f3": "Export PDF + Word",
    "pricing.consultant.f4": "Score de sécurité & mapping NIST/CIS/ISO",
    "pricing.consultant.f5": "Bonnes pratiques & checklist d'actions",
    "pricing.consultant.f6": "Conforme Loi 25 & PIPEDA",
    "pricing.agency.name": "Agence",
    "pricing.agency.badge": "Le plus populaire",
    "pricing.agency.price": "199 $",
    "pricing.agency.period": "/mois",
    "pricing.agency.desc": "Pour les MSP et agences TI qui gèrent plusieurs clients",
    "pricing.agency.cta": "Commencer",
    "pricing.agency.f1": "Tout du plan Consultant",
    "pricing.agency.f2": "Jusqu'à 10 profils clients",
    "pricing.agency.f3": "Branding personnalisé (logo client)",
    "pricing.agency.f4": "Gestion des versions de politiques",
    "pricing.agency.f5": "Tableau de bord multi-clients",
    "pricing.agency.f6": "Support prioritaire",

    // CTA
    "cta.title": "Démarrez votre premier diagnostic",
    "cta.subtitle": "Scannez votre domaine et obtenez vos premières politiques de conformité en moins de 20 minutes.",
    "cta.button": "Scanner mon domaine — Gratuit",

    // Footer
    "footer.copy": "© 2026 SecurePilot. Conçu pour les consultants IT et MSP canadiens.",
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
