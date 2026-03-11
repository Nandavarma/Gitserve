import { embed } from "@/lib/embeddings";
import { summarizeFile } from "@/lib/summarize";
import { supabase } from "@/lib/supabase";
import { fetchRepoTree, fetchFileContent, parseGithubUrl } from "@/lib/github";

// Vercel Hobby limit = 60 s; Pro = 300 s
export const maxDuration = 60;

// One embedding per file — cap the number of files processed per request
const MAX_FILES = 80;

export async function POST(req: Request) {
  try {
    /* ── 1. Parse & validate input ── */
    const body = await req.json().catch(() => ({}));
    const { repoUrl, forceReindex } = body as {
      repoUrl?: string;
      forceReindex?: boolean;
    };

    if (!repoUrl || typeof repoUrl !== "string") {
      return Response.json({ error: "repoUrl is required" }, { status: 400 });
    }

    /* ── 2. Derive owner / repo ── */
    const { owner, repo } = parseGithubUrl(repoUrl);
    const repoId = `${owner}/${repo}`;

    /* ── 3. Cache check — skip indexing if repo is already stored ── */
    if (!forceReindex) {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("repo_id", repoId);

      if (count && count > 0) {
        return Response.json({
          success: true,
          repoId,
          cached: true,
          chunksIndexed: count,
        });
      }
    }

    /* ── 4. Fetch repository file tree ── */
    const { files: allFiles, branch } = await fetchRepoTree(owner, repo);

    if (allFiles.length === 0) {
      return Response.json(
        { error: "No supported source files found in this repository." },
        { status: 400 },
      );
    }

    // Cap to MAX_FILES
    const files = allFiles.slice(0, MAX_FILES);

    /* ── 5. Remove stale chunks when force-reindexing ── */
    if (forceReindex) {
      try {
        await supabase.from("documents").delete().eq("repo_id", repoId);
      } catch {
        // Column may not exist yet — safe to ignore
      }
    }

    /* ── 6. Fetch, summarize, embed, store (1 row per file) ── */
    let filesProcessed = 0;
    let filesIndexed = 0;

    for (const file of files) {
      const content = await fetchFileContent(owner, repo, file.path, branch);
      if (!content || content.length < 15) continue;

      // Build a structured summary — this is what gets embedded
      const summary = summarizeFile(file.path, content);

      const embedding = await embed(summary);

      const { error } = await supabase.from("documents").insert({
        content: summary,
        embedding,
        repo_id: repoId,
      });

      if (!error) filesIndexed++;
      filesProcessed++;
    }

    if (filesProcessed === 0) {
      return Response.json(
        { error: "Could not read any files from this repository." },
        { status: 400 },
      );
    }

    return Response.json({
      success: true,
      repoId,
      cached: false,
      filesProcessed,
      filesIndexed,
      filePaths: files.map((f) => f.path),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ingestion failed";
    console.error("[ingest]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
