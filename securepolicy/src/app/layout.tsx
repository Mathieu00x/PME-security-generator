import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.securepilot.ca"),
  title: "SecurePilot — Politiques de sécurité pour PME / AI-Powered Security Policies for SMBs",
  description:
    "Générez des politiques de cybersécurité professionnelles en minutes. Generate professional cybersecurity policies in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
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