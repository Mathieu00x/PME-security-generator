import { Metadata } from "next";
import { HomeLanding } from "@/components/marketing/HomeLanding";

export const metadata: Metadata = {
  title: "SecurePilot — Évaluez. Corrigez. Démontrez. | Plateforme cybersécurité pour MSP canadiens",
  description:
    "SecurePilot aide les MSP et consultants IT canadiens à évaluer la posture de sécurité externe, mesurer la préparation à la Loi 25 et à PIPEDA, transformer les écarts en tâches de remédiation, et livrer des rapports prêts pour le client — depuis un seul espace de travail.",
  alternates: {
    canonical: "/fr",
    languages: { en: "/", fr: "/fr" },
  },
};

export default function LandingPageFr() {
  return <HomeLanding lang="fr" />;
}
