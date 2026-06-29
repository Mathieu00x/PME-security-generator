"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Policy } from "@/types";

interface Props {
  policy: Policy;
  companyName?: string;
  iconOnly?: boolean;
}

export function DownloadPDFButton({ policy, companyName = "Your Company", iconOnly = false }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = 210;
      const pageH = 297;
      const marginL = 20;
      const marginR = 20;
      const marginT = 20;
      const contentW = pageW - marginL - marginR;

      let y = marginT;

      function checkPageBreak(needed = 10) {
        if (y + needed > pageH - 20) {
          doc.addPage();
          y = marginT;
          drawHeader();
        }
      }

      function drawHeader() {
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(marginL, 8, 8, 8, 1.5, 1.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text("SP", marginL + 4, 13.5, { align: "center" });

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Secure", marginL + 10, 13);
        doc.setTextColor(37, 99, 235);
        doc.text("Policy", marginL + 24, 13);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageW - marginR, 13, { align: "right" });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginL, 18, pageW - marginR, 18);
      }

      // ── Cover page ────────────────────────────────────────────────────
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageW, 60, "F");

      doc.setFillColor(59, 130, 246);
      doc.roundedRect(marginL, 15, 14, 14, 2.5, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SP", marginL + 7, 24, { align: "center" });

      doc.setFontSize(14);
      doc.text("SecurePolicy", marginL + 18, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(191, 219, 254);
      doc.text("AI-Powered Security Documentation", marginL + 18, 26);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(policy.title, contentW);
      doc.text(titleLines, marginL, 48);

      y = 75;

      // Metadata box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginL, y, contentW, 40, 2, 2, "FD");

      const meta = [
        { label: "Company", value: companyName },
        { label: "Version", value: policy.version || "1.0" },
        { label: "Date", value: new Date(policy.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) },
        { label: "Review Date", value: new Date(new Date(policy.created_at).setFullYear(new Date(policy.created_at).getFullYear() + 1)).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) },
        { label: "Status", value: policy.status.charAt(0).toUpperCase() + policy.status.slice(1) },
        { label: "Classification", value: "Confidential" },
      ];

      const colW = contentW / 2;
      meta.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = marginL + 5 + col * colW;
        const itemY = y + 8 + row * 12;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(item.label.toUpperCase(), x, itemY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(item.value, x, itemY + 5);
      });

      y += 50;

      // Security score badge
      if (policy.security_score) {
        const score = policy.security_score.securityScore;
        const color = score >= 70 ? [34, 197, 94] : score >= 40 ? [245, 158, 11] : [239, 68, 68];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(marginL, y, 50, 16, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`Security Score: ${score}/100`, marginL + 25, y + 10, { align: "center" });

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Risk Level: ${policy.security_score.riskLevel}`, marginL + 58, y + 10);
        y += 24;
      }

      // Compliance badges on cover
      const cm = policy.security_score?.complianceMapping;
      if (cm) {
        const standards = [
          { key: "NIST", label: "NIST CSF", color: [37, 99, 235] as [number,number,number] },
          { key: "CIS", label: "CIS Controls", color: [124, 58, 237] as [number,number,number] },
          { key: "ISO27001", label: "ISO 27001", color: [16, 185, 129] as [number,number,number] },
        ].filter(s => cm[s.key as keyof typeof cm]?.length);

        if (standards.length) {
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text("ALIGNED WITH:", marginL, y);
          let bx = marginL + 24;
          standards.forEach(s => {
            doc.setFillColor(s.color[0], s.color[1], s.color[2]);
            doc.roundedRect(bx, y - 4, 22, 6, 1, 1, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.text(s.label, bx + 11, y, { align: "center" });
            bx += 25;
          });
          y += 10;
        }
      }

      // ── Policy content ────────────────────────────────────────────────
      doc.addPage();
      drawHeader();
      y = 28;

      const lines = policy.content.split("\n");
      let inList = false;

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        if (!line.trim()) {
          if (inList) { inList = false; y += 2; }
          else y += 3;
          continue;
        }

        if (/^#{1}\s/.test(line) || /^\d+\s+[A-Z]/.test(line)) {
          checkPageBreak(14);
          y += 4;
          doc.setFillColor(37, 99, 235);
          doc.rect(marginL, y - 4, 3, 9, "F");
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(line.replace(/^#+\s/, ""), marginL + 6, y + 2);
          y += 10;
          inList = false;
          continue;
        }

        if (/^#{2}\s/.test(line) || /^\d+\.\d+\s/.test(line)) {
          checkPageBreak(10);
          y += 2;
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(37, 99, 235);
          doc.text(line.replace(/^#+\s/, ""), marginL, y);
          y += 7;
          inList = false;
          continue;
        }

        if (/^#{3}\s/.test(line)) {
          checkPageBreak(8);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(51, 65, 85);
          doc.text(line.replace(/^#+\s/, ""), marginL, y);
          y += 6;
          inList = false;
          continue;
        }

        if (/^[•\-\*]\s/.test(line)) {
          checkPageBreak(6);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          const bulletText = line.replace(/^[•\-\*]\s/, "");
          const wrapped = doc.splitTextToSize(bulletText, contentW - 8);
          doc.setFillColor(37, 99, 235);
          doc.circle(marginL + 2, y - 1.5, 1, "F");
          doc.text(wrapped, marginL + 6, y);
          y += wrapped.length * 5 + 1;
          inList = true;
          continue;
        }

        checkPageBreak(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        const wrapped = doc.splitTextToSize(line, contentW);
        doc.text(wrapped, marginL, y);
        y += wrapped.length * 5 + 2;
        inList = false;
      }

      // ── Best Practices page ───────────────────────────────────────────
      const bp = policy.security_score?.bestPractices;
      if (bp && (bp.dos.length || bp.donts.length)) {
        doc.addPage();
        drawHeader();
        y = 28;

        // Section title
        doc.setFillColor(37, 99, 235);
        doc.rect(marginL, y - 4, 3, 9, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Bonnes pratiques", marginL + 6, y + 2);
        y += 14;

        // ✅ À faire
        if (bp.dos.length) {
          doc.setFillColor(240, 253, 244);
          doc.setDrawColor(187, 247, 208);
          doc.roundedRect(marginL, y - 2, contentW, 8 + bp.dos.length * 8, 2, 2, "FD");

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(21, 128, 61);
          doc.text("À faire", marginL + 4, y + 4);
          y += 10;

          bp.dos.forEach((item) => {
            checkPageBreak(8);
            doc.setFillColor(34, 197, 94);
            doc.circle(marginL + 4, y - 1, 1.5, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            const wrapped = doc.splitTextToSize(item, contentW - 12);
            doc.text(wrapped, marginL + 9, y);
            y += wrapped.length * 5 + 2;
          });

          y += 4;
        }

        // ❌ À éviter
        if (bp.donts.length) {
          checkPageBreak(10 + bp.donts.length * 8);
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(254, 202, 202);
          doc.roundedRect(marginL, y - 2, contentW, 8 + bp.donts.length * 8, 2, 2, "FD");

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(185, 28, 28);
          doc.text("À éviter", marginL + 4, y + 4);
          y += 10;

          bp.donts.forEach((item) => {
            checkPageBreak(8);
            doc.setFillColor(239, 68, 68);
            doc.circle(marginL + 4, y - 1, 1.5, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            const wrapped = doc.splitTextToSize(item, contentW - 12);
            doc.text(wrapped, marginL + 9, y);
            y += wrapped.length * 5 + 2;
          });
        }
      }

      // ── Action Checklist page ─────────────────────────────────────────
      const actions = policy.security_score?.actionItems;
      if (actions && actions.length) {
        doc.addPage();
        drawHeader();
        y = 28;

        doc.setFillColor(37, 99, 235);
        doc.rect(marginL, y - 4, 3, 9, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Actions prioritaires", marginL + 6, y + 2);
        y += 14;

        const PRIORITY_COLORS: Record<string, [number,number,number]> = {
          high: [239, 68, 68],
          medium: [245, 158, 11],
          low: [59, 130, 246],
        };
        const PRIORITY_LABELS: Record<string, string> = {
          high: "HAUTE",
          medium: "MOYENNE",
          low: "FAIBLE",
        };

        actions.forEach((item) => {
          checkPageBreak(14);
          // Checkbox
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.5);
          doc.rect(marginL, y - 3, 4, 4);

          // Priority badge
          const pc = PRIORITY_COLORS[item.priority] || [100, 116, 139];
          doc.setFillColor(pc[0], pc[1], pc[2]);
          doc.roundedRect(marginL + 7, y - 3, 14, 4, 1, 1, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(5);
          doc.setFont("helvetica", "bold");
          doc.text(PRIORITY_LABELS[item.priority] || item.priority.toUpperCase(), marginL + 14, y, { align: "center" });

          // Task
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          const taskLines = doc.splitTextToSize(item.task, contentW - 25);
          doc.text(taskLines, marginL + 24, y);
          y += taskLines.length * 5;

          // Tool
          if (item.tool) {
            doc.setFontSize(7);
            doc.setTextColor(37, 99, 235);
            doc.text(`→ ${item.tool}`, marginL + 24, y + 1);
            y += 5;
          }

          y += 4;
        });
      }

      // ── Footer on all pages ───────────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginL, pageH - 14, pageW - marginR, pageH - 14);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(`${policy.title} — v${policy.version || "1.0"} — CONFIDENTIAL`, marginL, pageH - 8);
        doc.text(`${i} / ${totalPages}`, pageW - marginR, pageH - 8, { align: "right" });
      }

      const filename = `${policy.title.replace(/\s+/g, "_")}_v${policy.version || "1.0"}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        title="Download PDF"
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {loading ? "Generating…" : "Download PDF"}
    </button>
  );
}
