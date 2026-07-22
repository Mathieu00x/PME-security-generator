// Converts a policy's plain "content" text (the same markdown-ish format
// used by PolicyViewer / DownloadPDFButton / DownloadWordButton) into the
// wire formats required by Notion and Confluence's export APIs.

import { SecurityScore } from "@/types";
import { COMPLIANCE_STANDARD_LABELS } from "@/lib/complianceLabels";
import { ARTIFACT_DEFINITIONS } from "@/lib/artifacts";

type NotionRichText = { type: "text"; text: { content: string } };
type NotionBlock = {
  object: "block";
  type: string;
  [key: string]: unknown;
};

const NOTION_TEXT_LIMIT = 2000;

function richText(text: string): NotionRichText[] {
  const trimmed = text.slice(0, NOTION_TEXT_LIMIT);
  return trimmed ? [{ type: "text", text: { content: trimmed } }] : [];
}

function block(type: string, richTextArr: NotionRichText[]): NotionBlock {
  return { object: "block", type, [type]: { rich_text: richTextArr } };
}

export function contentToNotionBlocks(content: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const lines = content.split("\n");

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) continue;

    if (/^#{1}\s/.test(line) || /^\d+\s+[A-Z]/.test(line)) {
      blocks.push(block("heading_1", richText(line.replace(/^#+\s/, ""))));
      continue;
    }
    if (/^#{2}\s/.test(line) || /^\d+\.\d+\s/.test(line)) {
      blocks.push(block("heading_2", richText(line.replace(/^#+\s/, ""))));
      continue;
    }
    if (/^#{3}\s/.test(line)) {
      blocks.push(block("heading_3", richText(line.replace(/^#+\s/, ""))));
      continue;
    }
    if (/^[•\-\*]\s/.test(line)) {
      blocks.push(block("bulleted_list_item", richText(line.replace(/^[•\-\*]\s/, ""))));
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      blocks.push(block("numbered_list_item", richText(line.replace(/^\d+\.\s/, ""))));
      continue;
    }

    blocks.push(block("paragraph", richText(line)));
  }

  return blocks;
}

export function executiveSummaryToNotionBlocks(summary: string): NotionBlock[] {
  return [
    block("heading_1", richText("Executive Summary")),
    block("paragraph", richText(summary)),
  ];
}

export function securityScoreToNotionBlocks(score: SecurityScore): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  const mapping = score.complianceMapping;
  const mappingEntries = mapping
    ? Object.entries(mapping).filter(([, codes]) => codes && codes.length)
    : [];
  if (mappingEntries.length) {
    blocks.push(block("heading_1", richText("Mapping aux normes")));
    mappingEntries.forEach(([key, codes]) => {
      blocks.push(block("heading_2", richText(COMPLIANCE_STANDARD_LABELS[key] || key)));
      (codes as string[]).forEach((code) => blocks.push(block("bulleted_list_item", richText(code))));
    });
  }

  if (score.gapAnalysis) {
    const gap = score.gapAnalysis;
    blocks.push(block("heading_1", richText("Analyse des écarts (Gap Analysis)")));
    blocks.push(
      block(
        "paragraph",
        richText(
          `Conformité actuelle : ${gap.compliancePercentage}%  ·  Contrôles manquants : ${gap.missingControlsCount}  ·  Risque associé : ${gap.associatedRisk}`
        )
      )
    );
    gap.missingControls.forEach((mc) => blocks.push(block("bulleted_list_item", richText(mc))));
  }

  if (score.auditEvidence && score.auditEvidence.length) {
    blocks.push(block("heading_1", richText("Audit Evidence")));
    blocks.push(block("paragraph", richText("Registers you should maintain to demonstrate compliance with this policy.")));
    score.auditEvidence.forEach((evidence) => {
      const label = ARTIFACT_DEFINITIONS[evidence.type]?.title || evidence.type;
      blocks.push(block("bulleted_list_item", richText(`${label} — ${evidence.reason}`)));
    });
  }

  if (score.actionItems && score.actionItems.length) {
    blocks.push(block("heading_1", richText("Prochaines étapes (plan d'action)")));
    score.actionItems.forEach((item) => {
      const tool = item.tool ? ` → ${item.tool}` : "";
      const time = item.estimatedTime ? ` (${item.estimatedTime})` : "";
      blocks.push(block("bulleted_list_item", richText(`[${item.priority.toUpperCase()}] ${item.task}${tool}${time}`)));
    });
  }

  if (score.recommendations && score.recommendations.length) {
    blocks.push(block("heading_1", richText("Recommandations priorisées")));
    score.recommendations.forEach((rec) => {
      blocks.push(block("bulleted_list_item", richText(`[${rec.priority.toUpperCase()}] ${rec.text}`)));
    });
  }

  return blocks;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function contentToConfluenceStorage(content: string): string {
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

    if (/^#{1}\s/.test(line) || /^\d+\s+[A-Z]/.test(line)) {
      closeList();
      html.push(`<h1>${escapeHtml(line.replace(/^#+\s/, ""))}</h1>`);
      continue;
    }
    if (/^#{2}\s/.test(line) || /^\d+\.\d+\s/.test(line)) {
      closeList();
      html.push(`<h2>${escapeHtml(line.replace(/^#+\s/, ""))}</h2>`);
      continue;
    }
    if (/^#{3}\s/.test(line)) {
      closeList();
      html.push(`<h3>${escapeHtml(line.replace(/^#+\s/, ""))}</h3>`);
      continue;
    }
    if (/^[•\-\*]\s/.test(line)) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${escapeHtml(line.replace(/^[•\-\*]\s/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

export function executiveSummaryToConfluenceStorage(summary: string): string {
  return `<h1>Executive Summary</h1>\n<p>${escapeHtml(summary)}</p>`;
}

export function securityScoreToConfluenceStorage(score: SecurityScore): string {
  const html: string[] = [];

  const mapping = score.complianceMapping;
  const mappingEntries = mapping
    ? Object.entries(mapping).filter(([, codes]) => codes && codes.length)
    : [];
  if (mappingEntries.length) {
    html.push("<h1>Mapping aux normes</h1>");
    mappingEntries.forEach(([key, codes]) => {
      html.push(`<h2>${escapeHtml(COMPLIANCE_STANDARD_LABELS[key] || key)}</h2>`);
      html.push("<ul>");
      (codes as string[]).forEach((code) => html.push(`<li>${escapeHtml(code)}</li>`));
      html.push("</ul>");
    });
  }

  if (score.gapAnalysis) {
    const gap = score.gapAnalysis;
    html.push("<h1>Analyse des écarts (Gap Analysis)</h1>");
    html.push(
      `<p><strong>Conformité actuelle :</strong> ${gap.compliancePercentage}% &nbsp; <strong>Contrôles manquants :</strong> ${gap.missingControlsCount} &nbsp; <strong>Risque associé :</strong> ${escapeHtml(gap.associatedRisk)}</p>`
    );
    if (gap.missingControls.length) {
      html.push("<ul>");
      gap.missingControls.forEach((mc) => html.push(`<li>${escapeHtml(mc)}</li>`));
      html.push("</ul>");
    }
  }

  if (score.auditEvidence && score.auditEvidence.length) {
    html.push("<h1>Audit Evidence</h1>");
    html.push("<p>Registers you should maintain to demonstrate compliance with this policy.</p>");
    html.push("<ul>");
    score.auditEvidence.forEach((evidence) => {
      const label = ARTIFACT_DEFINITIONS[evidence.type]?.title || evidence.type;
      html.push(`<li><strong>${escapeHtml(label)}</strong> — ${escapeHtml(evidence.reason)}</li>`);
    });
    html.push("</ul>");
  }

  if (score.actionItems && score.actionItems.length) {
    html.push("<h1>Prochaines étapes (plan d'action)</h1>");
    html.push("<ul>");
    score.actionItems.forEach((item) => {
      const tool = item.tool ? ` → ${escapeHtml(item.tool)}` : "";
      const time = item.estimatedTime ? ` (${escapeHtml(item.estimatedTime)})` : "";
      html.push(`<li><strong>[${item.priority.toUpperCase()}]</strong> ${escapeHtml(item.task)}${tool}${time}</li>`);
    });
    html.push("</ul>");
  }

  if (score.recommendations && score.recommendations.length) {
    html.push("<h1>Recommandations priorisées</h1>");
    html.push("<ul>");
    score.recommendations.forEach((rec) => {
      html.push(`<li><strong>[${rec.priority.toUpperCase()}]</strong> ${escapeHtml(rec.text)}</li>`);
    });
    html.push("</ul>");
  }

  return html.join("\n");
}
