"use client";

import type { ReactNode } from "react";

/**
 * Renders LLM markdown-like output: **bold**, *italic*, `code`, and line breaks.
 * Headings (##, ###), bullet lists (- item), and numbered lists are also handled.
 */
export function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → spacer
    if (!line.trim()) {
      nodes.push(<div key={i} style={{ height: "0.6rem" }} />);
      i++;
      continue;
    }

    // ### Heading level 3
    if (line.startsWith("### ")) {
      nodes.push(
        <p key={i} style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", margin: "0.75rem 0 0.25rem" }}>
          {renderInline(line.slice(4))}
        </p>,
      );
      i++;
      continue;
    }

    // ## Heading level 2
    if (line.startsWith("## ")) {
      nodes.push(
        <p key={i} style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", margin: "1rem 0 0.3rem" }}>
          {renderInline(line.slice(3))}
        </p>,
      );
      i++;
      continue;
    }

    // # Heading level 1
    if (line.startsWith("# ")) {
      nodes.push(
        <p key={i} style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--text-primary)", margin: "1rem 0 0.4rem" }}>
          {renderInline(line.slice(2))}
        </p>,
      );
      i++;
      continue;
    }

    // Bullet list items: - or *
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: "1.25rem", margin: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list items: 1. 2. etc.
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: "1.5rem", margin: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Fenced code block ```
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(
        <div
          key={`code-${i}`}
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(139,92,246,0.18)",
            borderRadius: "0.75rem",
            padding: "0.85rem 1rem",
            margin: "0.5rem 0",
            overflowX: "auto",
          }}
        >
          {lang && (
            <div style={{ fontSize: "0.65rem", color: "#8b5cf6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              {lang}
            </div>
          )}
          <pre style={{ margin: 0, fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.82rem", color: "#c4b5fd", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {codeLines.join("\n")}
          </pre>
        </div>,
      );
      continue;
    }

    // Regular paragraph line
    nodes.push(
      <p key={i} style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.7 }}>
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>{nodes}</div>;
}

/** Parse inline: **bold**, *italic*, `code` */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const m = match[0];
    if (m.startsWith("**")) {
      parts.push(
        <strong key={match.index} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
          {m.slice(2, -2)}
        </strong>,
      );
    } else if (m.startsWith("*")) {
      parts.push(
        <em key={match.index} style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
          {m.slice(1, -1)}
        </em>,
      );
    } else {
      parts.push(
        <code
          key={match.index}
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.82em",
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: "0.3rem",
            padding: "0.1em 0.35em",
            color: "#c4b5fd",
          }}
        >
          {m.slice(1, -1)}
        </code>,
      );
    }
    last = match.index + m.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}
