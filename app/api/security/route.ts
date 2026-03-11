import { supabase } from "@/lib/supabase";
import {
  scanChunk,
  calculateScore,
  type SecurityFinding,
} from "@/lib/security";
import { groq } from "@/lib/llm";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { repoId } = body as { repoId?: string };

    if (!repoId || typeof repoId !== "string") {
      return Response.json({ error: "repoId is required" }, { status: 400 });
    }

    /* ── 1. Fetch all stored chunks for this repo ── */
    const { data: documents, error: dbError } = await supabase
      .from("documents")
      .select("content")
      .eq("repo_id", repoId)
      .limit(500);

    if (dbError) {
      return Response.json(
        { error: "Failed to retrieve document chunks." },
        { status: 500 },
      );
    }

    if (!documents || documents.length === 0) {
      return Response.json(
        {
          error:
            "No indexed content found for this repository. Please ingest it first.",
        },
        { status: 404 },
      );
    }

    /* ── 2. Run rule-based scanner on each chunk ── */
    const allFindings: SecurityFinding[] = [];
    // Deduplicate by rule + path to avoid noise from chunking
    const seen = new Set<string>();
    const fileTypeMap = new Map<string, number>();

    for (const doc of documents) {
      const raw: string = doc.content ?? "";
      const newlineIdx = raw.indexOf("\n");
      const pathMatch =
        newlineIdx > 0 ? raw.slice(0, newlineIdx).match(/^\[(.+)\]$/) : null;
      const filePath = pathMatch ? pathMatch[1] : "unknown";
      const content = newlineIdx >= 0 ? raw.slice(newlineIdx + 1) : raw;

      // Track file types
      const ext = filePath.includes(".")
        ? filePath.split(".").pop()!.toLowerCase()
        : "other";
      fileTypeMap.set(ext, (fileTypeMap.get(ext) ?? 0) + 1);

      const findings = scanChunk(filePath, content);
      for (const finding of findings) {
        const key = `${finding.rule}::${finding.path ?? ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          allFindings.push(finding);
        }
      }
    }

    /* ── 3. Sort: critical → high → medium → low ── */
    const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
    allFindings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

    /* ── 4. Calculate score ── */
    const score = calculateScore(allFindings);

    /* ── 5. Ask Groq for a plain-text risk narrative ── */
    let summary = "";
    try {
      const findingLines =
        allFindings.length === 0
          ? "No issues found."
          : allFindings
              .slice(0, 20) // cap to avoid huge prompts
              .map(
                (f) =>
                  `[${f.severity.toUpperCase()}] ${f.rule}: ${f.message}${f.path ? ` (${f.path})` : ""}`,
              )
              .join("\n");

      const prompt =
        allFindings.length === 0
          ? `Repository "${repoId}" passed all security checks. Security score: ${score}/100. Write a concise 2-sentence reassurance noting what was checked.`
          : `Repository "${repoId}" security scan results (score ${score}/100):\n\n${findingLines}\n\nWrite a concise 2–4 sentence risk summary for a developer: highlight the most critical issues and the recommended priority for fixes. Plain text, no markdown.`;

      const chat = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 220,
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content:
              "You are a concise application security engineer providing actionable risk assessments. Write plain prose, no markdown or bullet points.",
          },
          { role: "user", content: prompt },
        ],
      });

      summary = chat.choices[0]?.message?.content?.trim() ?? "";
    } catch {
      summary = "";
    }

    return Response.json({
      findings: allFindings,
      summary,
      score,
      stats: {
        filesScanned: documents.length,
        rulesChecked: 16,
        categories: [
          {
            name: "Secrets & Credentials",
            checked: documents.length,
            passed:
              documents.length -
              allFindings.filter((f) =>
                [
                  "committed-env-file",
                  "committed-private-key",
                  "aws-access-key",
                  "hardcoded-api-key",
                  "hardcoded-jwt-secret",
                  "hardcoded-password",
                  "credentials-in-url",
                ].includes(f.rule),
              ).length,
          },
          {
            name: "Code Injection Risks",
            checked: documents.length,
            passed:
              documents.length -
              allFindings.filter((f) =>
                [
                  "eval-usage",
                  "sql-injection-risk",
                  "xss-innerhtml",
                  "command-injection-risk",
                  "path-traversal-risk",
                ].includes(f.rule),
              ).length,
          },
          {
            name: "Cryptography & TLS",
            checked: documents.length,
            passed:
              documents.length -
              allFindings.filter((f) =>
                ["weak-crypto-md5-sha1", "disabled-ssl-verification"].includes(
                  f.rule,
                ),
              ).length,
          },
          {
            name: "Access Control & CORS",
            checked: documents.length,
            passed:
              documents.length -
              allFindings.filter((f) => ["cors-wildcard"].includes(f.rule))
                .length,
          },
        ],
        fileTypes: Array.from(fileTypeMap.entries())
          .map(([ext, count]) => ({ ext, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Security scan failed";
    console.error("[security]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
