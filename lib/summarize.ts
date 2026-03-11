/**
 * Static file summarizer — no LLM calls, no extra API tokens.
 *
 * Produces a compact structured summary like:
 *
 *   File: src/auth/auth.service.ts
 *   Language: TypeScript
 *   Exports: loginUser, registerUser, hashPassword
 *   Dependencies: jsonwebtoken, bcrypt
 *   Purpose: Handles authentication and JWT token generation
 *
 *   <first 600 chars of raw source>
 *
 * The summary is what gets embedded (semantically rich, ~80 tokens).
 * The full string (summary + code preview) is stored as `content` so the
 * LLM has real code to reference when answering questions.
 */

const LANGUAGE_MAP: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript (React)",
  js: "JavaScript",
  jsx: "JavaScript (React)",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  go: "Go",
  rs: "Rust",
  java: "Java",
  c: "C",
  cpp: "C++",
  h: "C/C++ Header",
  hpp: "C++ Header",
  cs: "C#",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  scala: "Scala",
  lua: "Lua",
  vue: "Vue",
  svelte: "Svelte",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  md: "Markdown",
  mdx: "MDX",
  sql: "SQL",
  graphql: "GraphQL",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
};

/** Extract symbols and a purpose hint from a source file without any API calls. */
export function summarizeFile(filePath: string, content: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const language = LANGUAGE_MAP[ext] ?? ext.toUpperCase();

  // Only scan the first 300 lines to keep this fast
  const lines = content.split("\n").slice(0, 300);

  /* ── Exported symbols ── */
  const exports: string[] = [];

  if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) {
    for (const line of lines) {
      // export function/class/const/type/interface/enum/async function Foo
      const named = line.match(
        /^export\s+(?:default\s+)?(?:async\s+)?(?:function\s*\*?\s*|class\s+|const\s+|let\s+|var\s+|type\s+|interface\s+|enum\s+)(\w+)/,
      );
      if (named && !exports.includes(named[1])) exports.push(named[1]);

      // export { Foo, Bar }
      const brace = line.match(/^export\s*\{([^}]+)\}/);
      if (brace) {
        for (const sym of brace[1].split(",")) {
          const s = sym
            .trim()
            .split(/\s+as\s+/)[0]
            .trim();
          if (s && !exports.includes(s)) exports.push(s);
        }
      }
    }
  }

  if (ext === "py") {
    for (const line of lines) {
      const m = line.match(/^(?:def|class)\s+(\w+)/);
      if (m && !exports.includes(m[1])) exports.push(m[1]);
    }
  }

  if (ext === "go") {
    for (const line of lines) {
      // Exported (capitalised) Go identifiers
      const m = line.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?([A-Z]\w*)\s*\(/);
      if (m && !exports.includes(m[1])) exports.push(m[1]);
    }
  }

  /* ── External dependencies ── */
  const deps = new Set<string>();

  for (const line of lines) {
    // TS/JS: import … from '…'
    const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (fromMatch) {
      const dep = fromMatch[1];
      if (!dep.startsWith(".") && !dep.startsWith("/")) {
        // Normalise scoped packages @scope/pkg → keep both parts
        const parts = dep.split("/");
        deps.add(dep.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]);
      }
    }

    // require('…')
    const reqMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
    if (reqMatch) {
      const dep = reqMatch[1];
      if (!dep.startsWith(".") && !dep.startsWith("/"))
        deps.add(dep.split("/")[0]);
    }

    // Python: import X / from X import
    if (ext === "py") {
      const pyMatch = line.match(/^(?:import|from)\s+([\w.]+)/);
      if (pyMatch) deps.add(pyMatch[1].split(".")[0]);
    }

    // Go: import "pkg"
    if (ext === "go") {
      const goMatch = line.match(/^\s+"([^"]+)"/);
      if (goMatch) deps.add(goMatch[1].split("/").pop() ?? goMatch[1]);
    }
  }

  /* ── Purpose hint from leading comments ── */
  let purpose = "";
  for (const line of lines.slice(0, 30)) {
    const stripped = line.trim();
    const text = stripped
      .replace(/^\/\/+\s*/, "")
      .replace(/^#+\s*/, "")
      .replace(/^\/?\*+\s*/, "")
      .trim();
    if (
      text.length > 15 &&
      text.length < 200 &&
      !/^@|eslint|prettier|tslint/.test(text)
    ) {
      purpose = text;
      break;
    }
  }

  /* ── Assemble summary ── */
  const meta: string[] = [`File: ${filePath}`, `Language: ${language}`];

  if (exports.length > 0)
    meta.push(`Exports: ${exports.slice(0, 12).join(", ")}`);

  const externalDeps = [...deps].filter((d) => !d.startsWith(".")).slice(0, 10);
  if (externalDeps.length > 0)
    meta.push(`Dependencies: ${externalDeps.join(", ")}`);

  if (purpose) meta.push(`Purpose: ${purpose}`);

  // Code preview — enough for the LLM to answer real questions
  const codePreview = content.slice(0, 600).trim();

  return meta.join("\n") + "\n\n" + codePreview;
}
