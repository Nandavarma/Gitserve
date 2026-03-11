/**
 * Pre-index script for popular repositories.
 *
 * Run this ONCE locally (not on Vercel) to fill Supabase with embeddings for
 * all popular repos. After that, users load those repos instantly from cache
 * without consuming API credits.
 *
 * Usage:
 *   npm run preindex
 *
 * Requires a .env file (or environment) with:
 *   SUPABASE_URL=...
 *   SUPABASE_ANON_KEY=...
 *   GITHUB_TOKEN=...           (optional, raises rate limit 60 → 5000 req/h)
 *
 * NOTE: Uses the local @xenova/transformers model for embeddings so no
 *       HF_API_KEY credits are consumed during pre-indexing.
 */

import "dotenv/config";
import { pipeline, env } from "@xenova/transformers";
import { POPULAR_REPOS, repoUrl } from "../lib/popular-repos";
import { fetchRepoTree, fetchFileContent } from "../lib/github";
import { summarizeFile } from "../lib/summarize";
import { supabase } from "../lib/supabase";

// Write model cache to local .cache dir so it persists between runs
env.cacheDir = "./.transformers_cache";

const MAX_FILES = 80;

/* ── Local embedder (downloaded once, cached on disk) ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractor: any = null;

async function embedLocal(text: string): Promise<number[]> {
  if (!_extractor) {
    console.log("  [embed] Loading local model (first run may take ~30s) ...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _extractor = await (pipeline as any)(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (_extractor as any)(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(result.data as number[]);
}

async function indexRepo(owner: string, repo: string): Promise<void> {
  const repoId = `${owner}/${repo}`;

  /* ── 1. Skip if already indexed ── */
  const { count } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("repo_id", repoId);

  if (count && count > 0) {
    console.log(`  ✓ ${repoId} already indexed (${count} rows) — skipping`);
    return;
  }

  /* ── 2. Fetch file tree ── */
  console.log(`  ↳ Fetching tree for ${repoId} ...`);
  const { files: allFiles, branch } = await fetchRepoTree(owner, repo);
  const files = allFiles.slice(0, MAX_FILES);
  console.log(
    `    ${files.length} files (capped at ${MAX_FILES}) on branch "${branch}"`,
  );

  if (files.length === 0) {
    console.warn(`  ⚠  No files found for ${repoId}`);
    return;
  }

  /* ── 3. Fetch → summarize → embed → insert ── */
  let indexed = 0;
  for (const file of files) {
    const content = await fetchFileContent(owner, repo, file.path, branch);
    if (!content || content.length < 15) continue;

    const summary = summarizeFile(file.path, content);
    const embedding = await embedLocal(summary);

    const { error } = await supabase.from("documents").insert({
      content: summary,
      embedding,
      repo_id: repoId,
    });

    if (error) {
      console.error(`    ✗ insert error for ${file.path}:`, error.message);
    } else {
      indexed++;
    }
  }

  console.log(`  ✅ ${repoId}: indexed ${indexed} files`);
}

async function main() {
  console.log(
    `\n🚀 Pre-indexing ${POPULAR_REPOS.length} popular repositories\n`,
  );

  for (const r of POPULAR_REPOS) {
    console.log(`\n📦 ${r.label}  (${repoUrl(r)})`);
    try {
      await indexRepo(r.owner, r.repo);
    } catch (err) {
      console.error(
        `  ✗ Failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  console.log("\n✨ Pre-indexing complete.\n");
}

main();
