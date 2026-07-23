"use client";
import { useState } from "react";
import { FileCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ARTIFACT_ORDER, ARTIFACT_DEFINITIONS } from "@/lib/artifacts";
import { ArtifactRow, ArtifactType, Branding, CompanyProfile, Policy } from "@/types";
import { hexToRgb } from "@/lib/branding";
import { useLanguage } from "@/contexts/LanguageContext";

export function DownloadAuditReportButton({
  companyProfile,
  policies,
  artifacts,
  branding,
}: {
  companyProfile: CompanyProfile | null;
  policies: Policy[];
  artifacts: Record<ArtifactType, ArtifactRow[]>;
  branding: Branding;
}) {
  const { t, dateLocale } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const marginL = 14;
      const pageW = 210;

      const companyName = companyProfile?.company_name || "Your Company";
      const generatedOn = new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });
      const brandRgb = hexToRgb(branding.color);

      // Cover
      doc.setFillColor(brandRgb[0], brandRgb[1], brandRgb[2]);
      doc.rect(0, 0, pageW, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(t("audit.pdf.title"), marginL, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(companyName, marginL, 40);
      doc.setFontSize(9);
      doc.text(t("audit.pdf.generatedOn", { date: generatedOn }), marginL, 47);

      let y = 75;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(t("audit.pdf.companyProfile"), marginL, y);
      y += 8;

      const yes = t("audit.pdf.yes");
      const no = t("audit.pdf.no");

      if (companyProfile) {
        autoTable(doc, {
          startY: y,
          theme: "plain",
          styles: { fontSize: 9, cellPadding: 1.5 },
          body: [
            [t("audit.pdf.industry"), companyProfile.industry || "—"],
            [t("audit.pdf.employees"), companyProfile.employee_count || "—"],
            [t("audit.pdf.countryProvince"), `${companyProfile.country || "—"} / ${companyProfile.province || "—"}`],
            [t("audit.pdf.mfaEnabled"), companyProfile.mfa_enabled ? yes : no],
            [t("audit.pdf.backupsInPlace"), companyProfile.has_backups ? yes : no],
            [t("audit.pdf.itDeptMsp"), companyProfile.has_it_department ? yes : no],
          ],
          margin: { left: marginL },
        });
        // @ts-expect-error jspdf-autotable augments doc at runtime
        y = doc.lastAutoTable.finalY + 12;
      }

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(t("audit.pdf.activePolicies"), marginL, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [[t("audit.pdf.policy"), t("audit.pdf.version"), t("audit.pdf.status"), t("audit.pdf.securityScore"), t("audit.pdf.lastUpdated")]],
        body: policies.map((p) => [
          p.title,
          `v${p.version_number || 1}.0`,
          p.status,
          p.security_score ? `${p.security_score.securityScore}/100` : "—",
          new Date(p.updated_at).toLocaleDateString(dateLocale),
        ]),
        headStyles: { fillColor: brandRgb },
        styles: { fontSize: 8, cellPadding: 2.5 },
        margin: { left: marginL, right: marginL },
      });
      // @ts-expect-error jspdf-autotable augments doc at runtime
      y = doc.lastAutoTable.finalY + 12;

      let sectionNum = 3;
      for (const type of ARTIFACT_ORDER) {
        const definition = ARTIFACT_DEFINITIONS[type];
        const rows = artifacts[type] || [];
        if (rows.length === 0) continue;

        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(`${sectionNum}. ${t(definition.titleKey)}`, marginL, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [definition.columns.map((c) => t(c.labelKey))],
          body: rows.map((row) => definition.columns.map((c) => row[c.key] || "—")),
          headStyles: { fillColor: brandRgb },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: marginL, right: marginL },
        });
        // @ts-expect-error jspdf-autotable augments doc at runtime
        y = doc.lastAutoTable.finalY + 12;
        sectionNum += 1;
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(t("audit.pdf.footer", { companyName }), marginL, 290);
        doc.text(`${i} / ${totalPages}`, pageW - marginL, 290, { align: "right" });
      }

      doc.save(`${companyName.replace(/\s+/g, "_")}_Audit_Package.pdf`);
    } catch (err) {
      console.error("Audit report error:", err);
      alert(t("audit.reportFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : <FileCheck2 size={16} />}
      {loading ? t("audit.generating") : t("audit.generateFullReport")}
    </Button>
  );
}
