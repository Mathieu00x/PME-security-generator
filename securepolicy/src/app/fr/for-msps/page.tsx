import { Metadata } from "next";
import { ForMspsLanding } from "@/components/marketing/ForMspsLanding";

export const metadata: Metadata = {
  title: "Plateforme de cybersécurité pour MSP canadiens | SecurePilot",
  description:
    "Un seul espace de travail pour évaluer, corriger et livrer la sécurité et la conformité de chaque client — posture externe, préparation Loi 25 et PIPEDA, tâches de remédiation et rapports exécutifs.",
  alternates: {
    canonical: "/fr/for-msps",
    languages: { en: "/for-msps", fr: "/fr/for-msps" },
  },
};

export default function ForMspsPageFr() {
  return <ForMspsLanding lang="fr" />;
}
