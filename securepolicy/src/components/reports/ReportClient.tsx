"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Download, Sparkles, Radar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { markdownToHtml } from "@/lib/markdownToHtml";
import { AttackSurfaceReport, Client } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

export function ReportClient({ client, latestScan }: { client: Client; latestScan: AttackSurfaceReport | null }) {
  const { t } = useLanguage();
  const [generating, setGenerating] = useState(false);
  const [includeCompliance, setIncludeCompliance] = useState(true);
  const [markdown, setMarkdown] = useState<string | null>(null);

  async function handleGenerate() {
    if (!latestScan) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/executive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, scanId: latestScan.id, includeCompliance }),
      });
      if (!res.ok) throw new Error();
      const { markdown: md } = await res.json();
      setMarkdown(md);
    } catch {
      toast.error(t("report.generateFailed"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadPdf() {
    if (!markdown) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const marginL = 20;
    const pageW = 210;
    const pageH = 297;
    const contentW = pageW - marginL * 2;
    let y = 25;

    const checkPageBreak = (needed = 10) => {
      if (y + needed > pageH - 20) {
        doc.addPage();
        y = 25;
      }
    };

    const lines = markdown.split("\n");
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) {
        y += 3;
        continue;
      }
      if (/^-{3,}$/.test(line.trim())) {
        checkPageBreak(6);
        doc.setDrawColor(226, 232, 240);
        doc.line(marginL, y, pageW - marginL, y);
        y += 6;
        continue;
      }
      if (/^#{1}\s/.test(line)) {
        checkPageBreak(14);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        const wrapped = doc.splitTextToSize(line.replace(/^#+\s/, ""), contentW);
        doc.text(wrapped, marginL, y);
        y += wrapped.length * 7 + 4;
        continue;
      }
      if (/^#{2}\s/.test(line)) {
        checkPageBreak(10);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(line.replace(/^#+\s/, ""), marginL, y);
        y += 8;
        continue;
      }
      if (/^#{3}\s/.test(line)) {
        checkPageBreak(8);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        const wrapped = doc.splitTextToSize(line.replace(/^#+\s/, ""), contentW);
        doc.text(wrapped, marginL, y);
        y += wrapped.length * 5 + 3;
        continue;
      }
      if (/^[•\-\*]\s/.test(line)) {
        checkPageBreak(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        const wrapped = doc.splitTextToSize(line.replace(/^[•\-\*]\s/, ""), contentW - 6);
        doc.circle(marginL + 1.5, y - 1.5, 1, "F");
        doc.text(wrapped, marginL + 5, y);
        y += wrapped.length * 5 + 1;
        continue;
      }
      checkPageBreak(6);
      doc.setFontSize(9);
      doc.setFont("helvetica", line.startsWith("*") && line.endsWith("*") ? "italic" : "normal");
      doc.setTextColor(51, 65, 85);
      const clean = line.replace(/^\*(.+)\*$/, "$1");
      const wrapped = doc.splitTextToSize(clean, contentW);
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 5 + 2;
    }

    doc.save(`${client.name.replace(/\s+/g, "_")}_Rapport_Executif.pdf`);
  }

  if (!latestScan) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t("report.title")}</h1>
        <Card className="text-center py-12 mt-6">
          <Radar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 text-sm mb-4">{t("report.noScan")}</p>
          <Link href="/scan">
            <Button size="sm">{t("report.noScanCta")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">{t("report.title")}</h1>
      <p className="text-sm text-gray-500 mb-6">{t("report.subtitle")}</p>

      {!markdown ? (
        <Card className="text-center py-10">
          <FileText size={28} className="mx-auto text-blue-500 mb-3" />
          <label className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-5">
            <input
              type="checkbox"
              checked={includeCompliance}
              onChange={(e) => setIncludeCompliance(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
            />
            {t("report.includeCompliance")}
          </label>
          <Button onClick={handleGenerate} loading={generating}>
            {!generating && <Sparkles size={14} />}
            {generating ? t("report.generating") : t("report.generate")}
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download size={14} />
              {t("report.downloadPdf")}
            </Button>
          </div>
          <Card>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }} />
          </Card>
        </>
      )}
    </div>
  );
}
