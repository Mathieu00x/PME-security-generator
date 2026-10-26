import { Metadata } from "next";
import { ExternalAssessmentLanding } from "@/components/marketing/ExternalAssessmentLanding";

export const metadata: Metadata = {
  title: "External Security Assessment for MSPs | SecurePilot",
  description:
    "Passively assess a client's external security posture — SSL/TLS, email security, data exposure, asset discovery, headers, and technology fingerprint — turned into prioritized remediation tasks.",
  alternates: {
    canonical: "/external-security-assessment",
    languages: { en: "/external-security-assessment", fr: "/fr/external-security-assessment" },
  },
};

export default function ExternalAssessmentPage() {
  return <ExternalAssessmentLanding lang="en" />;
}
