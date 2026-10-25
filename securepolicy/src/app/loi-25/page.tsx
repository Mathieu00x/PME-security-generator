import { Metadata } from "next";
import { Loi25Landing } from "@/components/marketing/Loi25Landing";

export const metadata: Metadata = {
  title: "Loi 25 Readiness Assessment for Quebec Businesses | SecurePilot",
  description:
    "Assess Loi 25 readiness for your Quebec clients: governance, incident management, retention, and privacy rights — turned into a remediation roadmap.",
  alternates: {
    canonical: "/loi-25",
    languages: { en: "/loi-25", fr: "/fr/loi-25" },
  },
};

export default function Loi25Page() {
  return <Loi25Landing lang="en" />;
}
