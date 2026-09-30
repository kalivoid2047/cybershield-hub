import { Fragment } from "react";

// Minimal, dependency-free Markdown renderer for lesson content.
// Supports: ## / ### headings, paragraphs, ordered/unordered lists, > quotes,
// pipe tables, **bold**, `code`. Output is built from React elements only
// (no dangerouslySetInnerHTML), so lesson text can never inject markup.

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-cyan-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function parseMarkdown(source = "") {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: `h${heading[1].length}`, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        rows.push(lines[index].trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
        index += 1;
      }
      const [header, ...body] = rows;
      blocks.push({ type: "table", header, rows: body.filter((row) => !row.every((cell) => /^:?-+:?$/.test(cell))) });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const unordered = /^\s*[-*]\s+/;
    const ordered = /^\s*\d+\.\s+/;
    if (unordered.test(line) || ordered.test(line)) {
      const isOrdered = ordered.test(line);
      const pattern = isOrdered ? ordered : unordered;
      const items = [];
      while (index < lines.length && pattern.test(lines[index])) {
        items.push(lines[index].replace(pattern, ""));
        index += 1;
      }
      blocks.push({ type: isOrdered ? "ol" : "ul", items });
      continue;
    }

    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^(#{2,3}\s|\s*\||>\s?|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "p", text: paragraph.join(" ") });
  }

  return blocks;
}

export default function MarkdownContent({ source }) {
  return (
    <div className="space-y-4 text-base leading-8 text-slate-300">
      {parseMarkdown(source).map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} className="pt-4 text-xl font-semibold text-white">
                {renderInline(block.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} className="pt-2 text-lg font-semibold text-white">
                {renderInline(block.text)}
              </h3>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={index} className={`space-y-2 pl-6 ${block.type === "ul" ? "list-disc" : "list-decimal"} marker:text-cyanx`}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </List>
            );
          }
          case "quote":
            return (
              <blockquote key={index} className="rounded-r-lg border-l-4 border-cyanx/60 bg-cyanx/8 px-4 py-3 text-slate-200">
                {renderInline(block.text)}
              </blockquote>
            );
          case "table":
            return (
              <div key={index} className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.05] text-white">
                    <tr>
                      {block.header.map((cell, cellIndex) => (
                        <th key={cellIndex} className="px-4 py-2 font-semibold">
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-white/10">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return <p key={index}>{renderInline(block.text)}</p>;
        }
      })}
    </div>
  );
}
