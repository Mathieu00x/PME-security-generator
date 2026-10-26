import { Metadata } from "next";
import { PipedaLanding } from "@/components/marketing/PipedaLanding";

export const metadata: Metadata = {
  title: "Évaluation de préparation PIPEDA pour les entreprises canadiennes | SecurePilot",
  description:
    "Évaluez la préparation PIPEDA de vos clients selon les 10 principes de l'Annexe 1 — responsabilité, mesures de sécurité, accès individuel — jusqu'à la feuille de route de remédiation.",
  alternates: {
    canonical: "/fr/pipeda",
    languages: { en: "/pipeda", fr: "/fr/pipeda" },
  },
};

export default function PipedaPageFr() {
  return <PipedaLanding lang="fr" />;
}
