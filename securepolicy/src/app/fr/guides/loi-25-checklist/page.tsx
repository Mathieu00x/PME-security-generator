import { Metadata } from "next";
import { Loi25ChecklistGuide } from "@/components/marketing/Loi25ChecklistGuide";

export const metadata: Metadata = {
  title: "Liste de vérification Loi 25 pour les MSP québécois | SecurePilot",
  description:
    "Une liste de vérification pratique en 13 points pour la Loi 25 — gouvernance, incidents, conservation, ÉFVP, droits des personnes et consentement — les mêmes questions que l'évaluation SecurePilot.",
  alternates: {
    canonical: "/fr/guides/loi-25-checklist",
    languages: { en: "/guides/loi-25-checklist", fr: "/fr/guides/loi-25-checklist" },
  },
};

export default function Loi25ChecklistPageFr() {
  return <Loi25ChecklistGuide lang="fr" />;
}
