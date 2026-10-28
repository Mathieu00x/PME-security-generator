"use client";

import { Fragment } from "react";
import { parseMarkdownBlocks, parseInlineSegments, type MarkdownBlock } from "@/lib/markdown";

// Structured React rendering instead of dangerouslySetInnerHTML — every
// piece of text below is inserted as plain React children (never raw HTML),
// so content containing "<script>" or similar is displayed as literal text
// rather than parsed as markup, with no manual escaping step to remember.
// Shares its Markdown parser with the PDF export (src/lib/pdf/markdownToPdf.ts
// via src/lib/markdown.ts) so the on-screen preview matches what gets
// downloaded — same tables, same bold/italic, same horizontal rules.

function InlineText({ text }: { text: string }) {
  const segments = parseInlineSegments(text);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.code) return <code key={i} className="bg-gray-100 text-pink-700 rounded px-1 py-0.5 text-[0.85em]">{seg.text}</code>;
        if (seg.bold && seg.italic) return <strong key={i}><em>{seg.text}</em></strong>;
        if (seg.bold) return <strong key={i}>{seg.text}</strong>;
        if (seg.italic) return <em key={i}>{seg.text}</em>;
        return <Fragment key={i}>{seg.text}</Fragment>;
      })}
    </>
  );
}

export function PolicyViewer({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);
  const elements: React.ReactNode[] = [];
  let listBuffer: { type: "listItem"; text: string }[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="list-disc ml-4 space-y-1 my-2">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 leading-relaxed">
            <InlineText text={item.text} />
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  blocks.forEach((block: MarkdownBlock, idx) => {
    if (block.type === "listItem") {
      listBuffer.push(block);
      return;
    }
    flushList(`list-${idx}`);

    switch (block.type) {
      case "heading":
        if (block.level === 1) {
          elements.push(
            <h1 key={idx} className="text-2xl font-bold text-gray-900 mt-6 mb-3">
              <InlineText text={block.text} />
            </h1>
          );
        } else if (block.level === 2) {
          elements.push(
            <h2 key={idx} className="text-xl font-bold text-gray-900 mt-5 mb-2">
              <InlineText text={block.text} />
            </h2>
          );
        } else {
          elements.push(
            <h3 key={idx} className="text-base font-semibold text-gray-800 mt-4 mb-1.5">
              <InlineText text={block.text} />
            </h3>
          );
        }
        break;

      case "table":
        elements.push(
          <div key={idx} className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                      <InlineText text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri} className="even:bg-gray-50/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-gray-200 px-3 py-2 text-gray-700 align-top">
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        break;

      case "hr":
        elements.push(<hr key={idx} className="my-4 border-gray-200" />);
        break;

      case "blank":
        // Block-level margins on headings/paragraphs/tables already provide
        // spacing — no separate element needed for a blank source line.
        break;

      case "paragraph":
        elements.push(
          <p key={idx} className="text-sm text-gray-700 leading-relaxed">
            <InlineText text={block.text} />
          </p>
        );
        break;
    }
  });
  flushList("list-end");

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
      <div className="prose prose-sm max-w-none">{elements}</div>
    </div>
  );
}
