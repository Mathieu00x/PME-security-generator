import type { jsPDF } from "jspdf";

// A small, self-contained Markdown-subset renderer for jsPDF. Kept separate
// from DownloadPDFButton.tsx so the parsing/layout logic can be reasoned
// about (and extended) on its own, instead of growing as more regex
// branches inside an already-long draw function.
//
// Supported: headings (# / ## / ### and the numbered "1 Title" / "1.1 Title"
// convention already used by generated policies), paragraphs, bullet lists,
// Markdown tables, inline **bold** / *italic* / `code`, and page breaks
// (via the caller-supplied checkPageBreakY). Anything else falls through to
// plain text, same as before this module existed.

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "listItem"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "blank" };

interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line: string) => /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(line) && line.includes("-");

// A horizontal rule is a line made up ENTIRELY of 3+ of the same -, *, or _
// character (optionally padded with whitespace) — never mixed with other
// text, so a sentence that happens to contain "---" or legitimate hyphens
// never matches this. Table separator rows always contain "|" and are
// already consumed by the table branch above before this check runs, so
// the two can't be confused with each other.
const isHorizontalRule = (line: string) => /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const rawLines = content.split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trimEnd();

    if (!line.trim()) {
      blocks.push({ type: "blank" });
      i++;
      continue;
    }

    if (isTableRow(line) && i + 1 < rawLines.length && isTableSeparator(rawLines[i + 1])) {
      const headers = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < rawLines.length && isTableRow(rawLines[i])) {
        rows.push(splitTableRow(rawLines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (isHorizontalRule(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (/^#\s+/.test(line) || /^\d+\s+[A-Z]/.test(line)) {
      blocks.push({ type: "heading", level: 1, text: line.replace(/^#+\s/, "") });
      i++;
      continue;
    }
    if (/^##\s+/.test(line) || /^\d+\.\d+\s/.test(line)) {
      blocks.push({ type: "heading", level: 2, text: line.replace(/^#+\s/, "") });
      i++;
      continue;
    }
    if (/^###\s+/.test(line)) {
      blocks.push({ type: "heading", level: 3, text: line.replace(/^#+\s/, "") });
      i++;
      continue;
    }
    if (/^[•\-\*]\s/.test(line)) {
      blocks.push({ type: "listItem", text: line.replace(/^[•\-\*]\s/, "") });
      i++;
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
    i++;
  }

  return blocks;
}

export function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const tokenRe = /(\*\*.+?\*\*|\*.+?\*|`.+?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false, italic: false, code: false });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      segments.push({ text: token.slice(2, -2), bold: true, italic: false, code: false });
    } else if (token.startsWith("`")) {
      segments.push({ text: token.slice(1, -1), bold: false, italic: false, code: true });
    } else {
      segments.push({ text: token.slice(1, -1), bold: false, italic: true, code: false });
    }
    lastIndex = tokenRe.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false, italic: false, code: false });
  }

  return segments.filter((s) => s.text.length > 0);
}

export function stripInlineMarkers(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1");
}

interface ParagraphOptions {
  fontSize?: number;
  color?: [number, number, number];
  lineHeight?: number;
  checkPageBreakY: (y: number, needed?: number) => number;
}

// Manual word-by-word layout so **bold**/*italic*/`code` runs can be mixed
// on one wrapped line — jsPDF's text() only supports a single font style
// per call, so each styled run is measured and placed individually.
export function renderStyledParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: ParagraphOptions
): number {
  const fontSize = opts.fontSize ?? 9;
  const color = opts.color ?? [51, 65, 85];
  const lineHeight = opts.lineHeight ?? 5;
  doc.setFontSize(fontSize);

  const segments = parseInlineSegments(text);
  const tokens: { text: string; bold: boolean; italic: boolean; code: boolean; isSpace: boolean }[] = [];
  for (const seg of segments) {
    const parts = seg.text.split(/(\s+)/).filter((p) => p.length > 0);
    for (const part of parts) {
      tokens.push({ text: part, bold: seg.bold, italic: seg.italic, code: seg.code, isSpace: /^\s+$/.test(part) });
    }
  }

  let curY = y;
  let curX = x;
  doc.setFont("helvetica", "normal");
  const spaceWidth = doc.getTextWidth(" ");

  for (const tok of tokens) {
    const fontName = tok.code ? "courier" : "helvetica";
    const fontStyle = tok.bold && tok.italic ? "bolditalic" : tok.bold ? "bold" : tok.italic ? "italic" : "normal";
    doc.setFont(fontName, fontStyle);
    const w = tok.isSpace ? spaceWidth : doc.getTextWidth(tok.text);

    if (tok.isSpace) {
      if (curX > x) curX += w;
      continue;
    }

    if (curX + w > x + maxWidth && curX > x) {
      curY += lineHeight;
      curY = opts.checkPageBreakY(curY, lineHeight);
      curX = x;
    }

    if (tok.code) doc.setTextColor(190, 24, 93);
    else doc.setTextColor(color[0], color[1], color[2]);
    doc.text(tok.text, curX, curY);
    curX += w;
  }

  return curY + lineHeight;
}

interface TableOptions {
  brandColor: [number, number, number];
  checkPageBreakY: (y: number, needed?: number) => number;
}

// Equal column widths rather than content-weighted sizing — simpler,
// predictable, and avoids a second fragile heuristic on top of the parser.
export function renderMarkdownTable(
  doc: jsPDF,
  table: { headers: string[]; rows: string[][] },
  x: number,
  y: number,
  maxWidth: number,
  opts: TableOptions
): number {
  const colCount = Math.max(table.headers.length, 1);
  const colWidth = maxWidth / colCount;
  const cellPaddingX = 2;
  const fontSize = 8;
  const lineHeight = 4.2;
  doc.setFontSize(fontSize);

  const wrapCell = (text: string) => doc.splitTextToSize(stripInlineMarkers(text), colWidth - cellPaddingX * 2);

  const drawRow = (cells: string[], rowY: number, isHeader: boolean): number => {
    const wrapped = cells.map((c) => wrapCell(c ?? ""));
    const rowLines = Math.max(...wrapped.map((w) => w.length), 1);
    const rowHeight = rowLines * lineHeight + 3;

    const startY = opts.checkPageBreakY(rowY, rowHeight);

    if (isHeader) {
      doc.setFillColor(opts.brandColor[0], opts.brandColor[1], opts.brandColor[2]);
      doc.rect(x, startY - 3, maxWidth, rowHeight, "F");
    } else {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(x, startY - 3, maxWidth, rowHeight, "S");
    }

    wrapped.forEach((lines, colIdx) => {
      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setTextColor(isHeader ? 255 : 51, isHeader ? 255 : 65, isHeader ? 255 : 85);
      doc.text(lines, x + colIdx * colWidth + cellPaddingX, startY);
      if (colIdx > 0) {
        doc.setDrawColor(isHeader ? opts.brandColor[0] : 226, isHeader ? opts.brandColor[1] : 232, isHeader ? opts.brandColor[2] : 240);
        doc.line(x + colIdx * colWidth, startY - 3, x + colIdx * colWidth, startY - 3 + rowHeight);
      }
    });

    return startY + rowHeight;
  };

  let curY = drawRow(table.headers, y, true);
  for (const row of table.rows) {
    curY = drawRow(row, curY, false);
  }
  return curY + 4;
}

export interface RenderMarkdownOptions {
  brandColor: [number, number, number];
  checkPageBreakY: (y: number, needed?: number) => number;
}

export function renderMarkdownContent(
  doc: jsPDF,
  content: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: RenderMarkdownOptions
): number {
  const blocks = parseMarkdownBlocks(content);
  let curY = y;
  let prevWasListItem = false;

  for (const block of blocks) {
    if (block.type === "blank") {
      curY += prevWasListItem ? 2 : 3;
      prevWasListItem = false;
      continue;
    }

    if (block.type === "hr") {
      curY = opts.checkPageBreakY(curY, 6);
      curY += 2;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(x, curY, x + maxWidth, curY);
      curY += 4;
      prevWasListItem = false;
      continue;
    }

    if (block.type === "table") {
      curY += 2;
      curY = renderMarkdownTable(doc, block, x, curY, maxWidth, opts);
      prevWasListItem = false;
      continue;
    }

    if (block.type === "heading") {
      const text = stripInlineMarkers(block.text);
      if (block.level === 1) {
        curY = opts.checkPageBreakY(curY, 14);
        curY += 4;
        doc.setFillColor(opts.brandColor[0], opts.brandColor[1], opts.brandColor[2]);
        doc.rect(x, curY - 4, 3, 9, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(text, x + 6, curY + 2);
        curY += 10;
      } else if (block.level === 2) {
        curY = opts.checkPageBreakY(curY, 10);
        curY += 2;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(opts.brandColor[0], opts.brandColor[1], opts.brandColor[2]);
        doc.text(text, x, curY);
        curY += 7;
      } else {
        curY = opts.checkPageBreakY(curY, 8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text(text, x, curY);
        curY += 6;
      }
      prevWasListItem = false;
      continue;
    }

    if (block.type === "listItem") {
      curY = opts.checkPageBreakY(curY, 6);
      doc.setFillColor(opts.brandColor[0], opts.brandColor[1], opts.brandColor[2]);
      doc.circle(x + 2, curY - 1.5, 1, "F");
      curY = renderStyledParagraph(doc, block.text, x + 6, curY, maxWidth - 8, {
        fontSize: 9,
        color: [51, 65, 85],
        lineHeight: 5,
        checkPageBreakY: opts.checkPageBreakY,
      });
      curY += 1;
      prevWasListItem = true;
      continue;
    }

    curY = opts.checkPageBreakY(curY, 6);
    curY = renderStyledParagraph(doc, block.text, x, curY, maxWidth, {
      fontSize: 9,
      color: [51, 65, 85],
      lineHeight: 5,
      checkPageBreakY: opts.checkPageBreakY,
    });
    curY += 2;
    prevWasListItem = false;
  }

  return curY;
}
