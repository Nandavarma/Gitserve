import { embed } from "@/lib/embeddings";
import { chunkText } from "@/lib/chunk";
import { supabase } from "@/lib/supabase";
import { fetchRepoTree, fetchFileContent, parseGithubUrl } from "@/lib/github";

// Allow up to 5 minutes on Vercel (hobby = 60 s, pro = 300 s)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    /* ── 1. Parse & validate input ── */
    const body = await req.json().catch(() => ({}));
    const { repoUrl } = body as { repoUrl?: string };

    if (!repoUrl || typeof repoUrl !== "string") {
      return Response.json({ error: "repoUrl is required" }, { status: 400 });
    }

    /* ── 2. Derive owner / repo ── */
    const { owner, repo } = parseGithubUrl(repoUrl);
    const repoId = `${owner}/${repo}`;

    /* ── 3. Fetch repository file tree ── */
    const { files, branch } = await fetchRepoTree(owner, repo);

    if (files.length === 0) {
      return Response.json(
        { error: "No supported source files found in this repository." },
        { status: 400 },
      );
    }

    /* ── 4. Remove stale chunks for this repo (best-effort) ── */
    try {
      await supabase.from("documents").delete().eq("repo_id", repoId);
    } catch {
      // Column may not exist yet — safe to ignore
    }

    /* ── 5. Fetch, chunk, embed, store ── */
    let filesProcessed = 0;
    let chunksIndexed = 0;

    for (const file of files) {
      const content = await fetchFileContent(owner, repo, file.path, branch);
      if (!content || content.length < 15) continue;

      const chunks = chunkText(content, 400);

      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (trimmed.length < 20) continue;

        // Prefix with file path so retrieval results are self-identifying
        const tagged = `[${file.path}]\n${trimmed}`;

        const embedding = await embed(tagged);

        const { error } = await supabase.from("documents").insert({
          content: tagged,
          embedding,
          repo_id: repoId,
        });

        if (!error) chunksIndexed++;
      }

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
      filesProcessed,
      chunksIndexed,
      filePaths: files.map((f) => f.path),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ingestion failed";
    console.error("[ingest]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
