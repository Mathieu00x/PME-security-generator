"use client";

import { escapeHtml } from "@/lib/htmlEscape";

export function PolicyViewer({ content }: { content: string }) {
  // Convert markdown-like headings and bullets to HTML for display.
  // Every piece of the original text is HTML-escaped before being wrapped in
  // tags — this content is AI-generated from user-supplied questionnaire
  // answers and can be viewed by anyone with a public share link, so it must
  // never be interpolated raw into dangerouslySetInnerHTML.
  const formatted = content
    .split("\n")
    .map((line) => {
      if (/^#{1}\s/.test(line)) return `<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-3">${escapeHtml(line.replace(/^#+\s/, ""))}</h1>`;
      if (/^#{2}\s/.test(line)) return `<h2 class="text-xl font-bold text-gray-900 mt-5 mb-2">${escapeHtml(line.replace(/^#+\s/, ""))}</h2>`;
      if (/^#{3}\s/.test(line)) return `<h3 class="text-base font-semibold text-gray-800 mt-4 mb-1.5">${escapeHtml(line.replace(/^#+\s/, ""))}</h3>`;
      if (/^\d+\.\s/.test(line)) return `<p class="text-base font-semibold text-gray-900 mt-4 mb-2">${escapeHtml(line)}</p>`;
      if (/^\d+\.\d+\s/.test(line)) return `<p class="text-sm font-medium text-gray-800 mt-3 mb-1.5 ml-2">${escapeHtml(line)}</p>`;
      if (/^[•\-\*]\s/.test(line)) return `<li class="text-sm text-gray-700 ml-4 list-disc leading-relaxed">${escapeHtml(line.replace(/^[•\-\*]\s/, ""))}</li>`;
      if (line.trim() === "") return "<br />";
      return `<p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(line)}</p>`;
    })
    .join("\n");

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    </div>
  );
}
