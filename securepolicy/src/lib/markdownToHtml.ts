import { escapeHtml } from "@/lib/htmlEscape";

// Lightweight line-based markdown → HTML renderer for on-screen display of
// AI-generated reports (headings, bullets, italics, horizontal rules, bold).
// Deliberately not a general-purpose markdown library — reuses the same
// line-detection approach already established in lib/exporters.ts
// (contentToConfluenceStorage) for the app's other markdown-ish content,
// extended with *italic* and **bold** inline handling, which this report
// format uses for its byline and footer disclaimer.
function renderInline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return html;
}

export function markdownToHtml(content: string): string {
  const lines = content.split("\n");
  const html: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }
    if (/^-{3,}$/.test(line.trim())) {
      closeList();
      html.push("<hr />");
      continue;
    }
    if (/^#{1}\s/.test(line)) {
      closeList();
      html.push(`<h1>${renderInline(line.replace(/^#+\s/, ""))}</h1>`);
      continue;
    }
    if (/^#{2}\s/.test(line)) {
      closeList();
      html.push(`<h2>${renderInline(line.replace(/^#+\s/, ""))}</h2>`);
      continue;
    }
    if (/^#{3}\s/.test(line)) {
      closeList();
      html.push(`<h3>${renderInline(line.replace(/^#+\s/, ""))}</h3>`);
      continue;
    }
    if (/^[•\-\*]\s/.test(line)) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInline(line.replace(/^[•\-\*]\s/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}
