"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ArtifactDefinition } from "@/lib/artifacts";
import { ArtifactRow, Branding } from "@/types";
import { resolveBranding, hexToRgb } from "@/lib/branding";
import { useLanguage } from "@/contexts/LanguageContext";

export function DownloadRegisterPDFButton({
  definition,
  rows,
  companyName,
  branding,
}: {
  definition: ArtifactDefinition;
  rows: ArtifactRow[];
  companyName: string;
  branding?: Branding;
}) {
  const { t, dateLocale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const brandRgb = hexToRgb((branding || resolveBranding(null)).color);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const title = t(definition.titleKey);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(title, 14, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(
        t("register.pdfFooter", {
          companyName,
          date: new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" }),
        }),
        14,
        24
      );

      autoTable(doc, {
        startY: 30,
        head: [definition.columns.map((c) => t(c.labelKey))],
        body: rows.map((row) => definition.columns.map((c) => row[c.key] || "—")),
        headStyles: { fillColor: brandRgb },
        styles: { fontSize: 8, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Register PDF error:", err);
      alert(t("register.pdfFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading || rows.length === 0}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {loading ? t("audit.generating") : t("register.exportPDF")}
    </Button>
  );
}
