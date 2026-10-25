import { Metadata } from "next";
import { Loi25Landing } from "@/components/marketing/Loi25Landing";

export const metadata: Metadata = {
  title: "Évaluation de préparation Loi 25 pour les entreprises québécoises | SecurePilot",
  description:
    "Évaluez la préparation Loi 25 de vos clients québécois : gouvernance, incidents, conservation et droits des personnes — jusqu'à la feuille de route de remédiation.",
  alternates: {
    canonical: "/fr/loi-25",
    languages: { en: "/loi-25", fr: "/fr/loi-25" },
  },
};

export default function Loi25PageFr() {
  return <Loi25Landing lang="fr" />;
}
