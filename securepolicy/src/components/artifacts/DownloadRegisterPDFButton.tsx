"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ArtifactDefinition } from "@/lib/artifacts";
import { ArtifactRow, Branding } from "@/types";
import { resolveBranding, hexToRgb } from "@/lib/branding";

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
  const [loading, setLoading] = useState(false);
  const brandRgb = hexToRgb((branding || resolveBranding(null)).color);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(definition.title, 14, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${companyName} — Generated ${new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} — Confidential`,
        14,
        24
      );

      autoTable(doc, {
        startY: 30,
        head: [definition.columns.map((c) => c.label)],
        body: rows.map((row) => definition.columns.map((c) => row[c.key] || "—")),
        headStyles: { fillColor: brandRgb },
        styles: { fontSize: 8, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${definition.title.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Register PDF error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading || rows.length === 0}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {loading ? "Generating…" : "Export PDF"}
    </Button>
  );
}
