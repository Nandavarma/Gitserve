import { analyseStructure, type StructureFinding } from "@/lib/structure";
import { groq } from "@/lib/llm";

/* ── Generate a visual folder tree from flat file paths ── */
function generateFolderTree(paths: string[]): string {
  interface TreeNode {
    children: Map<string, TreeNode>;
  }

  const root: TreeNode = { children: new Map() };

  for (const p of paths) {
    const parts = p.split("/");
    let current = root;
    for (const part of parts) {
      if (!current.children.has(part)) {
        current.children.set(part, { children: new Map() });
      }
      current = current.children.get(part)!;
    }
  }

  const lines: string[] = [];

  function walk(node: TreeNode, prefix: string) {
    const entries = Array.from(node.children.entries()).sort(
      ([a, av], [b, bv]) => {
        const aIsDir = av.children.size > 0;
        const bIsDir = bv.children.size > 0;
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.localeCompare(b);
      },
    );

    entries.forEach(([name, child], i) => {
      const isLast = i === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const isDir = child.children.size > 0;
      lines.push(`${prefix}${connector}${name}${isDir ? "/" : ""}`);
      if (isDir) {
        walk(child, prefix + (isLast ? "    " : "│   "));
      }
    });
  }

  walk(root, "");
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { repoId, filePaths } = body as {
      repoId?: string;
      filePaths?: string[];
    };

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return Response.json(
        { error: "filePaths array is required" },
        { status: 400 },
      );
    }

    /* ── 1. Rule-based analysis (no LLM, runs on file paths only) ── */
    const { framework, findings } = analyseStructure(filePaths);

    /* ── 1b. Generate folder tree markdown ── */
    const folderTree = generateFolderTree(filePaths);

    /* ── 2. Ask Groq for a short human-readable summary ─────────────
       We send ONLY the findings array (not the full file list or code)
       so we never leak repository content to the LLM.              ── */
    let summary = "";
    try {
      const findingsSummary: string = findings
        .map(
          (f: StructureFinding) =>
            `[${f.severity.toUpperCase()}] ${f.rule}: ${f.message}`,
        )
        .join("\n");

      const prompt =
        findings.length === 0
          ? `The repository "${repoId ?? "unknown"}" is a ${framework} project. No structural issues were detected. Write a single short paragraph (2–3 sentences) congratulating the developer and briefly noting what looks well-structured.`
          : `The repository "${repoId ?? "unknown"}" is a ${framework} project. A rule-based analyser found these structural issues:\n\n${findingsSummary}\n\nWrite a concise 2–4 sentence summary for a developer: what the main concerns are and the priority order to fix them. Do not repeat every finding verbatim — give an overall picture. Plain text, no markdown or bullet points.`;

      const chat = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 200,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a concise senior software engineer giving actionable feedback on project structure. Write plain readable prose, no markdown.",
          },
          { role: "user", content: prompt },
        ],
      });

      summary = chat.choices[0]?.message?.content?.trim() ?? "";
    } catch {
      // Groq failure is non-fatal — return findings without a summary
      summary = "";
    }

    return Response.json({ framework, findings, summary, folderTree });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Structure analysis failed";
    console.error("[structure]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
