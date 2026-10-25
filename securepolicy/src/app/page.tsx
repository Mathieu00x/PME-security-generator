import { Metadata } from "next";
import { HomeLanding } from "@/components/marketing/HomeLanding";

export const metadata: Metadata = {
  title: "SecurePilot — Assess. Remediate. Prove. | Cybersecurity platform for Canadian MSPs",
  description:
    "SecurePilot helps Canadian MSPs and IT consultants assess external security posture, evaluate Loi 25 & PIPEDA readiness, turn gaps into remediation tasks, and deliver client-ready reports — from one workspace.",
  alternates: {
    canonical: "/",
    languages: { en: "/", fr: "/fr" },
  },
};

export default function LandingPage() {
  return <HomeLanding lang="en" />;
}
