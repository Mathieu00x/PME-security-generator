"use client";
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Policy } from "@/types";

interface Props {
  policy: Policy;
  companyName?: string;
}

export function DownloadWordButton({ policy, companyName = "Your Company" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        HeadingLevel,
        AlignmentType,
        Table,
        TableRow,
        TableCell,
        WidthType,
        ShadingType,
        BorderStyle,
        PageNumber,
        Header,
        Footer,
        LevelFormat,
        PageBreak,
      } = await import("docx");

      // ── Helpers ───────────────────────────────────────────────────────

      const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
      const cellBorders = { top: border, bottom: border, left: border, right: border };

      /** Strip markdown bold (**text**) and return TextRun array with bold applied */
      function parseInline(text: string): InstanceType<typeof TextRun>[] {
        const parts: InstanceType<typeof TextRun>[] = [];
        const re = /\*\*(.+?)\*\*/g;
        let last = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) parts.push(new TextRun({ text: text.slice(last, m.index), size: 20 }));
          parts.push(new TextRun({ text: m[1], bold: true, size: 20 }));
          last = m.index + m[0].length;
        }
        if (last < text.length) parts.push(new TextRun({ text: text.slice(last), size: 20 }));
        return parts;
      }

      /** Parse a markdown table block into a Word Table */
      function makeTable(rows: string[]): InstanceType<typeof Table> {
        const dataRows = rows.filter((r) => !r.match(/^\|[-:| ]+\|$/));
        const parsedRows = dataRows.map((r) =>
          r
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim())
        );
        const colCount = parsedRows[0]?.length || 1;
        const tableW = 9026;
        const colW = Math.floor(tableW / colCount);

        return new Table({
          width: { size: tableW, type: WidthType.DXA },
          columnWidths: Array(colCount).fill(colW),
          rows: parsedRows.map((cells, ri) =>
            new TableRow({
              children: cells.map((cell) =>
                new TableCell({
                  borders: cellBorders,
                  width: { size: colW, type: WidthType.DXA },
                  shading: ri === 0 ? { fill: "EFF6FF", type: ShadingType.CLEAR } : undefined,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: parseInline(cell),
                      ...(ri === 0 ? { heading: HeadingLevel.HEADING_3 } : {}),
                    }),
                  ],
                })
              ),
            })
          ),
        });
      }

      // ── Numbering config ──────────────────────────────────────────────
      const numberingConfig = {
        config: [
          {
            reference: "bullets",
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              },
            ],
          },
        ],
      };

      // ── Build content ─────────────────────────────────────────────────
      type DocChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;
      const children: DocChild[] = [];

      // Cover metadata table
      const metaRows = [
        ["Company", companyName],
        ["Version", policy.version || "1.0"],
        ["Date", new Date(policy.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })],
        ["Status", policy.status.charAt(0).toUpperCase() + policy.status.slice(1)],
        ["Classification", "Confidential"],
      ];
      if (policy.security_score) {
        metaRows.push(["Security Score", `${policy.security_score.securityScore}/100 — ${policy.security_score.riskLevel} Risk`]);
      }

      children.push(
        new Paragraph({
          children: [new TextRun({ text: policy.title, bold: true, size: 52, color: "1E3A5F" })],
          spacing: { before: 0, after: 240 },
        })
      );

      children.push(
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2200, 6826],
          rows: metaRows.map(
            ([label, value]) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders: cellBorders,
                    width: { size: 2200, type: WidthType.DXA },
                    shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: "64748B" })] })],
                  }),
                  new TableCell({
                    borders: cellBorders,
                    width: { size: 6826, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: value, size: 18 })] })],
                  }),
                ],
              })
          ),
        }) as unknown as DocChild
      );

      children.push(new Paragraph({ children: [new PageBreak()] }));

      // ── Parse policy content ──────────────────────────────────────────
      const lines = policy.content.split("\n");
      let i = 0;

      while (i < lines.length) {
        const raw = lines[i];
        const line = raw.trimEnd();

        // Skip horizontal rules
        if (/^-{3,}$/.test(line.trim())) { i++; continue; }

        // Blank line
        if (!line.trim()) {
          children.push(new Paragraph({ text: "", spacing: { after: 60 } }));
          i++;
          continue;
        }

        // Markdown table (collect all rows of the block)
        if (/^\|/.test(line)) {
          const tableLines: string[] = [];
          while (i < lines.length && /^\|/.test(lines[i].trim())) {
            tableLines.push(lines[i]);
            i++;
          }
          if (tableLines.length >= 2) {
            children.push(makeTable(tableLines) as unknown as DocChild);
            children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
          }
          continue;
        }

        // H1 — # heading or "1 Title"
        if (/^#{1}\s/.test(line) || /^\d+\s+[A-Z]/.test(line)) {
          const text = line.replace(/^#+\s/, "").replace(/^\d+\s+/, "");
          children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: parseInline(text),
            spacing: { before: 360, after: 120 },
          }));
          i++; continue;
        }

        // H2 — ## heading or "1.1 Something"
        if (/^#{2}\s/.test(line) || /^\d+\.\d+\s/.test(line)) {
          const text = line.replace(/^#+\s/, "");
          children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: parseInline(text),
            spacing: { before: 240, after: 80 },
          }));
          i++; continue;
        }

        // H3
        if (/^#{3}\s/.test(line)) {
          const text = line.replace(/^#+\s/, "");
          children.push(new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: parseInline(text),
            spacing: { before: 160, after: 60 },
          }));
          i++; continue;
        }

        // Numbered list items ("1. Item", "2. Item")
        if (/^\d+\.\s/.test(line) && !/^\d+\.\d+/.test(line)) {
          const text = line.replace(/^\d+\.\s/, "");
          children.push(new Paragraph({
            children: parseInline(text),
            numbering: { reference: "bullets", level: 0 },
            spacing: { after: 60 },
          }));
          i++; continue;
        }

        // Bullet
        if (/^[•\-\*]\s/.test(line)) {
          const text = line.replace(/^[•\-\*]\s/, "");
          children.push(new Paragraph({
            children: parseInline(text),
            numbering: { reference: "bullets", level: 0 },
            spacing: { after: 60 },
          }));
          i++; continue;
        }

        // Regular paragraph (strip any remaining markdown bold)
        children.push(new Paragraph({
          children: parseInline(line),
          spacing: { after: 100 },
        }));
        i++;
      }

      // ── Best Practices ────────────────────────────────────────────────
      const bp = policy.security_score?.bestPractices;
      if (bp && (bp.dos.length || bp.donts.length)) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Bonnes pratiques")],
          spacing: { before: 0, after: 200 },
        }));

        if (bp.dos.length) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "À faire", bold: true, size: 22, color: "15803D" })],
            spacing: { before: 160, after: 100 },
          }));
          bp.dos.forEach((item) => {
            children.push(new Paragraph({
              children: [new TextRun({ text: item, size: 20 })],
              numbering: { reference: "bullets", level: 0 },
              spacing: { after: 60 },
            }));
          });
        }

        if (bp.donts.length) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "À éviter", bold: true, size: 22, color: "B91C1C" })],
            spacing: { before: 200, after: 100 },
          }));
          bp.donts.forEach((item) => {
            children.push(new Paragraph({
              children: [new TextRun({ text: item, size: 20 })],
              numbering: { reference: "bullets", level: 0 },
              spacing: { after: 60 },
            }));
          });
        }
      }

      // ── Action Checklist ──────────────────────────────────────────────
      const actions = policy.security_score?.actionItems;
      if (actions && actions.length) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Actions prioritaires")],
          spacing: { before: 0, after: 200 },
        }));

        const PRIORITY_COLORS: Record<string, string> = {
          high: "DC2626",
          medium: "D97706",
          low: "2563EB",
        };
        const PRIORITY_LABELS: Record<string, string> = {
          high: "HAUTE",
          medium: "MOYENNE",
          low: "FAIBLE",
        };

        actions.forEach((item) => {
          const color = PRIORITY_COLORS[item.priority] || "64748B";
          const label = PRIORITY_LABELS[item.priority] || item.priority.toUpperCase();
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: "☐  ", size: 22 }),
                new TextRun({ text: `[${label}]  `, bold: true, size: 18, color }),
                new TextRun({ text: item.task, size: 20 }),
                ...(item.tool
                  ? [new TextRun({ text: `  →  ${item.tool}`, size: 18, color: "2563EB", italics: true })]
                  : []),
              ],
              spacing: { after: 120 },
            })
          );
        });
      }

      // ── Document ──────────────────────────────────────────────────────
      const doc = new Document({
        numbering: numberingConfig,
        styles: {
          default: {
            document: { run: { font: "Calibri", size: 20, color: "1E293B" } },
          },
          paragraphStyles: [
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: { size: 32, bold: true, font: "Calibri", color: "1E3A5F" },
              paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
            },
            {
              id: "Heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: { size: 24, bold: true, font: "Calibri", color: "2563EB" },
              paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 },
            },
            {
              id: "Heading3",
              name: "Heading 3",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: { size: 22, bold: true, font: "Calibri", color: "334155" },
              paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 },
            },
          ],
        },
        sections: [
          {
            properties: {
              page: {
                size: { width: 11906, height: 16838 },
                margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
              },
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "SecurePolicy  —  ", size: 16, color: "94A3B8" }),
                      new TextRun({ text: policy.title, size: 16, bold: true, color: "64748B" }),
                      new TextRun({ text: "\t", size: 16 }),
                      new TextRun({ text: "CONFIDENTIEL", size: 16, color: "94A3B8" }),
                    ],
                    tabStops: [{ type: "right" as const, position: 9026 }],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "E2E8F0", space: 1 } },
                  }),
                ],
              }),
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `v${policy.version || "1.0"}  —  ${companyName}\t`, size: 16, color: "94A3B8" }),
                      new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "94A3B8" }),
                      new TextRun({ text: " / ", size: 16, color: "94A3B8" }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "94A3B8" }),
                    ],
                    tabStops: [{ type: "right" as const, position: 9026 }],
                    border: { top: { style: BorderStyle.SINGLE, size: 3, color: "E2E8F0", space: 1 } },
                  }),
                ],
              }),
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${policy.title.replace(/\s+/g, "_")}_v${policy.version || "1.0"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Word error:", err);
      alert("Failed to generate Word document. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
      {loading ? "Generating…" : "Download Word"}
    </button>
  );
}
