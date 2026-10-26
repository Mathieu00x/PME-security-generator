import { Metadata } from "next";
import { PipedaLanding } from "@/components/marketing/PipedaLanding";

export const metadata: Metadata = {
  title: "PIPEDA Readiness Assessment for Canadian Businesses | SecurePilot",
  description:
    "Assess PIPEDA readiness for your clients across all 10 Schedule 1 principles — accountability, safeguards, individual access — turned into a remediation roadmap.",
  alternates: {
    canonical: "/pipeda",
    languages: { en: "/pipeda", fr: "/fr/pipeda" },
  },
};

export default function PipedaPage() {
  return <PipedaLanding lang="en" />;
}
