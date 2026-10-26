import { Metadata } from "next";
import { ExternalAssessmentLanding } from "@/components/marketing/ExternalAssessmentLanding";

export const metadata: Metadata = {
  title: "Évaluation de sécurité externe pour MSP | SecurePilot",
  description:
    "Évaluez passivement la posture de sécurité externe d'un client — SSL/TLS, sécurité des courriels, exposition de données, découverte d'actifs, en-têtes, empreinte technologique — jusqu'aux tâches de remédiation priorisées.",
  alternates: {
    canonical: "/fr/external-security-assessment",
    languages: { en: "/external-security-assessment", fr: "/fr/external-security-assessment" },
  },
};

export default function ExternalAssessmentPageFr() {
  return <ExternalAssessmentLanding lang="fr" />;
}
