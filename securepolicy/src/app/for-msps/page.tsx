import { Metadata } from "next";
import { ForMspsLanding } from "@/components/marketing/ForMspsLanding";

export const metadata: Metadata = {
  title: "Cybersecurity Platform for Canadian MSPs | SecurePilot",
  description:
    "One workspace to assess, remediate, and deliver security and compliance for every client — external posture, Loi 25 & PIPEDA readiness, remediation tasks, and executive reports.",
  alternates: {
    canonical: "/for-msps",
    languages: { en: "/for-msps", fr: "/fr/for-msps" },
  },
};

export default function ForMspsPage() {
  return <ForMspsLanding lang="en" />;
}
