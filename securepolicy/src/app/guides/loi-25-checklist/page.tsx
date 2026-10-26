import { Metadata } from "next";
import { Loi25ChecklistGuide } from "@/components/marketing/Loi25ChecklistGuide";

export const metadata: Metadata = {
  title: "Loi 25 Readiness Checklist for Quebec MSPs | SecurePilot",
  description:
    "A practical, 13-point Loi 25 readiness checklist across governance, incident management, retention, PIA, individual rights, and consent — the same questions SecurePilot's own assessment asks.",
  alternates: {
    canonical: "/guides/loi-25-checklist",
    languages: { en: "/guides/loi-25-checklist", fr: "/fr/guides/loi-25-checklist" },
  },
};

export default function Loi25ChecklistPage() {
  return <Loi25ChecklistGuide lang="en" />;
}
