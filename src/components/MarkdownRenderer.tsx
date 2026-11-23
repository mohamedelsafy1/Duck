import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Render paragraphs, headings, lists, tables
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];
  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (listBuffer) {
      if (listBuffer.type === 'ul') {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="my-3 list-disc pr-6 space-y-1.5 text-zinc-800 leading-relaxed"
          >
            {listBuffer.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="my-3 list-decimal pr-6 space-y-1.5 text-zinc-800 leading-relaxed"
          >
            {listBuffer.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        );
      }
      listBuffer = null;
    }
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const rows = tableBuffer.map((line) =>
        line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );

      const headerRow = rows[0];
      const dataRows = rows.slice(2); // Skip separator row

      elements.push(
        <div key={`table-${elements.length}`} className="my-4 overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                {headerRow?.map((cell, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2.5 text-right font-semibold text-zinc-900 border-l last:border-l-0 border-zinc-200"
                    dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-50/50">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-4 py-2 text-zinc-700 border-l last:border-l-0 border-zinc-200"
                      dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block check
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="my-3 p-4 bg-zinc-900 text-zinc-100 rounded-lg text-xs font-mono overflow-x-auto text-left"
            dir="ltr"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Table check
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      inTable = true;
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Heading checks
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1
          key={`h1-${elements.length}`}
          className="text-xl md:text-2xl font-bold text-zinc-900 mt-6 mb-3 border-b border-zinc-200 pb-2"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(2)) }}
        />
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="text-lg md:text-xl font-bold text-zinc-900 mt-5 mb-2.5"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(3)) }}
        />
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="text-base md:text-lg font-semibold text-zinc-900 mt-4 mb-2"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(4)) }}
        />
      );
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className="text-sm md:text-base font-semibold text-zinc-800 mt-3 mb-1.5"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(5)) }}
        />
      );
      continue;
    }

    // List item check
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList();
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(ulMatch[1]);
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList();
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(olMatch[2]);
      continue;
    }

    // Empty line or paragraph
    flushList();

    if (trimmed === '') {
      continue;
    }

    // Normal paragraph
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="my-2.5 text-zinc-800 leading-relaxed text-sm md:text-base"
        dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
      />
    );
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

// Simple inline markdown formatting (bold, italic, code) with safe escaping
function formatInline(str: string): string {
  if (!str) return '';

  let escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 mx-1 bg-zinc-100 text-zinc-900 rounded text-xs font-mono border border-zinc-200" dir="ltr">$1</code>');

  // Bold: **text** or __text__
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-zinc-900">$1</strong>');
  escaped = escaped.replace(/__([^_]+)__/g, '<strong class="font-semibold text-zinc-900">$1</strong>');

  // Italic: *text* or _text_
  escaped = escaped.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em class="italic text-zinc-700">$2</em>$3');

  return escaped;
}
