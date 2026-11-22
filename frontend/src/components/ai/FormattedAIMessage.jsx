import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Normalizes raw or squished AI table responses (like || Field | Details || ... ||)
 * and unorganized pipe-separated project lines into clean, readable, structured executive items.
 */
export function normalizeAIContent(text) {
  if (!text || typeof text !== "string") return text;

  // 1. Convert standalone "Project: XYZ" or "Task: XYZ" into a clear markdown heading
  let processed = text.replace(/^(?:Project|Task|Issue):\s*([^\n]+)$/gm, "### $1");

  // 2. Expand single-line double-pipe table chains: e.g. || Field | Details || ... ||
  if (processed.includes("||")) {
    processed = processed.replace(/\|\|\s*/g, "\n");
  }

  // 3. Clean up unorganized inline pipe lists:
  // e.g. "4. Project Name - ID: #83 | Identifier: KRI-CJ-13 | Status: In Progress | Priority: High | Lead: Cyrus Jones"
  processed = processed.replace(
    /^\s*(\d+\.)\s+([^\n-]+?)\s+-\s+ID:\s*#?(\d+)\s*\|\s*Identifier:\s*([^\s|]+)\s*\|\s*Status:\s*([^|\n]+)\s*\|\s*Priority:\s*([^|\n]+)\s*\|\s*Lead:\s*([^\n]+)$/gm,
    (match, num, title, id, ident, status, priority, lead) => {
      const cleanIdent = ident.trim();
      const cleanStatus = status.trim();
      const cleanPriority = priority.trim();
      const cleanLead = lead.trim();
      return `${num} **${title.trim()}**\n   - \`${cleanIdent}\` (ID: #${id.trim()}) · **${cleanStatus}** · Priority: *${cleanPriority}* · Lead: ${cleanLead}`;
    }
  );

  // 4. Process pipe tables if any exist
  if (processed.includes("|")) {
    const rawLines = processed.split("\n");
    const newLines = [];

    const isHeaderOrSeparator = (line, nextLine) => {
      const trimmed = line.trim();
      // Separator rows: |---|---| or --------|---------
      if (/^\|?[-:\s|]+\|?$/.test(trimmed) && trimmed.includes("-")) return true;
      // Preceding header row before a separator
      if (nextLine && /^\|?[-:\s|]+\|?$/.test(nextLine.trim()) && nextLine.includes("-")) return true;
      // Generic table headers
      if (/^\|?\s*(field|property|attribute|item|key|#|id|no\.?|task|project|issue)\s*\|\s*(details|value|description|info|name|title|assignee|status|priority)\s*(\|[^\n|]+)?\|?$/i.test(trimmed)) {
        return true;
      }
      return false;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const nextLine = rawLines[i + 1];
      const trimmed = line.trim();

      if (isHeaderOrSeparator(line, nextLine)) {
        continue;
      }

      // Check for row with 2 columns: | Key | Value |
      const row2Match = trimmed.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
      if (row2Match) {
        const key = row2Match[1].trim().replace(/^\*\*|\*\*$/g, "");
        let val = row2Match[2].trim().replace(/^\||\|$/g, "");
        if (key && val) {
          // Wrap identifiers like KRI-CJ-6 in inline code badge
          if (/^[A-Z]{2,}-[A-Z0-9-]+$/.test(val)) {
            val = `\`${val}\``;
          }
          newLines.push(`- **${key}:** ${val}`);
          continue;
        }
      }

      // Check for row with 3 columns: | Col1 | Col2 | Col3 |
      const row3Match = trimmed.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
      if (row3Match) {
        const c1 = row3Match[1].trim().replace(/^\*\*|\*\*$/g, "");
        const c2 = row3Match[2].trim();
        const c3 = row3Match[3].trim();
        if (c1 && c2 && c3) {
          newLines.push(`- **${c1}:** ${c2} — *${c3}*`);
          continue;
        }
      }

      newLines.push(line);
    }
    processed = newLines.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  return processed;
}

export default function FormattedAIMessage({ content = "", className = "" }) {
  if (!content) return null;
  const cleanContent = normalizeAIContent(content);

  return (
    <div className={`prose-zinc max-w-none text-[13.5px] sm:text-[14px] leading-relaxed select-text space-y-2 ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 mb-2 tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[15.5px] font-semibold text-zinc-900 dark:text-zinc-100 mt-3.5 mb-2 tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-1.5 tracking-tight first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-zinc-800 dark:text-[#ececec] my-1.5 leading-relaxed break-words last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-800 dark:text-[#ececec]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-800 dark:text-[#ececec]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-800 dark:text-zinc-200">
              {children}
            </em>
          ),
          code: ({ inline, className, children, ...props }) => {
            const str = String(children || "");
            const hasNewlines = str.includes("\n");
            if (inline || !hasNewlines) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] font-mono text-[12px] text-zinc-900 dark:text-zinc-100 font-medium inline-block">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2 rounded-xl bg-zinc-900 dark:bg-zinc-950 text-zinc-100 font-mono text-[12.5px] overflow-x-auto border border-black/10 dark:border-white/10">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 my-2 text-zinc-600 dark:text-zinc-400 italic">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-3 border-black/[0.08] dark:border-white/[0.08]" />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}

