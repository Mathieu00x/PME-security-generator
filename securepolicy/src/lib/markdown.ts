// Pure Markdown-subset parser shared by every renderer that needs to turn
// AI-generated policy content into structured output — the PDF export
// (src/lib/pdf/markdownToPdf.ts) and the in-app preview
// (src/components/policies/PolicyViewer.tsx). Deliberately has zero
// dependency on jsPDF or React, so either renderer can consume it without
// pulling the other's runtime into its bundle.
//
// Supported: headings (# / ## / ### and the numbered "1 Title" / "1.1
// Title" convention also used by generated policies), paragraphs, bullet
// lists, Markdown tables, inline **bold** / *italic* / `code`, and
// horizontal rules (lines made entirely of 3+ repeated -, *, or _).
// Anything else falls through to plain paragraph text.

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "listItem"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "blank" };

export interface InlineSegment {
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
// already consumed by the table branch before this check runs, so the two
// can't be confused with each other.
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
