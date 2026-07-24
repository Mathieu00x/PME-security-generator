import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.securepilot.ca"),
  title: "SecurePilot — Scan. Secure. Comply. | Plateforme cybersécurité pour consultants IT",
  description:
    "Scannez la surface d'attaque de vos clients, générez leurs politiques de conformité et exportez des rapports professionnels — en 20 minutes par client. / Scan your clients' attack surface, generate compliance policies, and export professional reports — in 20 minutes per client.",
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