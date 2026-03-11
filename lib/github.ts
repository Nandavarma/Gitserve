/**
 * GitHub repository helpers.
 *
 * Supabase schema required (run once in the SQL editor):
 *
 *   ALTER TABLE documents ADD COLUMN IF NOT EXISTS repo_id text;
 *   CREATE INDEX IF NOT EXISTS idx_documents_repo_id ON documents(repo_id);
 *
 * Optionally set GITHUB_TOKEN env var to raise the rate limit from 60 → 5000 req/h.
 */

const SUPPORTED_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "rb",
  "php",
  "swift",
  "kt",
  "scala",
  "lua",
  "vue",
  "svelte",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "yaml",
  "yml",
  "toml",
  "md",
  "mdx",
  "txt",
  "sql",
  "graphql",
  "sh",
  "bash",
  "zsh",
  "dockerfile",
  "makefile",
  "gitignore",
  "editorconfig",
]);

const IGNORED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  ".cache",
  "vendor",
  "__pycache__",
  ".pytest_cache",
  "target",
  ".gradle",
  "bin",
  "obj",
  "pkg",
  ".turbo",
]);

export interface RepoFile {
  path: string;
  sha: string;
  size: number;
}

/** Parse a GitHub URL (various formats) into owner + repo. */
export function parseGithubUrl(url: string): { owner: string; repo: string } {
  const cleaned = url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  const [owner, repo] = cleaned.split("/");
  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub URL "${url}". Expected format: https://github.com/owner/repo`,
    );
  }
  return { owner, repo };
}

/** Fetch the full recursive file tree, trying common default branches. */
export async function fetchRepoTree(
  owner: string,
  repo: string,
): Promise<{ files: RepoFile[]; branch: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "knowledge-agent/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  for (const branch of ["main", "master", "develop", "trunk"]) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers },
      );
      if (!res.ok) continue;

      const data: {
        tree?: Array<{ type: string; path: string; sha: string; size: number }>;
      } = await res.json();
      if (!data.tree) continue;

      const files: RepoFile[] = data.tree
        .filter((item) => {
          if (item.type !== "blob") return false;
          if (item.size > 60_000) return false; // skip files > 60 KB

          const parts = item.path.split("/");
          if (parts.some((p) => IGNORED_SEGMENTS.has(p.toLowerCase())))
            return false;

          const name = parts[parts.length - 1].toLowerCase();
          const ext = name.includes(".") ? (name.split(".").pop() ?? "") : name;
          return SUPPORTED_EXTENSIONS.has(ext);
        })
        .slice(0, 100)
        .map(({ path, sha, size }) => ({ path, sha, size }));

      return { files, branch };
    } catch {
      continue;
    }
  }

  throw new Error(`Repository not found or inaccessible: ${owner}/${repo}`);
}

/** Fetch raw file content via raw.githubusercontent.com (no API rate limit). */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
      {
        headers: { "User-Agent": "knowledge-agent/1.0" },
        signal: AbortSignal.timeout(12_000), // 12 s per file
      },
    );
    if (!res.ok) return "";
    return res.text();
  } catch {
    return "";
  }
}
