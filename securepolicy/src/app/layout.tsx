import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.securepilot.ca"),
  title: "SecurePilot — Assess. Remediate. Prove. | Plateforme cybersécurité pour MSP canadiens",
  description:
    "Évaluez la posture de sécurité externe de vos clients, mesurez leur préparation Loi 25 et PIPEDA, et livrez des rapports prêts pour le client — depuis un seul espace de travail. / Assess your clients' external security posture, evaluate Loi 25 & PIPEDA readiness, and deliver client-ready reports — from one workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}