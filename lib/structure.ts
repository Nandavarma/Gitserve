import nextjsRules from "@/lib/rules/nextjs.json";
import reactRules from "@/lib/rules/react.json";
import genericRules from "@/lib/rules/generic.json";

export interface StructureFinding {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  suggestion: string;
  path?: string;
}

export interface StructureResult {
  framework: string;
  findings: StructureFinding[];
}

interface RuleDefinition {
  id: string;
  severity: "error" | "warning" | "info";
  check: string;
  message: string;
  suggestion: string;
}

// ── Framework detection ──────────────────────────────────────────────────────

function detectFramework(paths: string[]): string {
  const flat = paths.join("\n");

  // Next.js: has app/ or pages/ directory with next config
  if (
    (flat.includes("app/") || flat.includes("pages/")) &&
    paths.some((p) => p.startsWith("next.config"))
  ) {
    return "Next.js";
  }

  // Has src/ and typical React project shape without Next.js
  if (
    paths.some((p) => p.startsWith("src/")) &&
    paths.some((p) => p.endsWith(".tsx") || p.endsWith(".jsx")) &&
    !paths.some((p) => p.startsWith("next.config"))
  ) {
    return "React";
  }

  // Has app/ but no next.config → maybe just Next (no config found in tree)
  if (flat.includes("app/") && paths.some((p) => p.endsWith(".tsx"))) {
    return "Next.js";
  }

  // TypeScript project with no clear framework markers
  if (paths.some((p) => p.endsWith(".ts") || p.endsWith(".tsx"))) {
    return "TypeScript";
  }

  return "JavaScript";
}

// ── Check implementations ────────────────────────────────────────────────────

function runCheck(
  check: string,
  paths: string[],
): { triggered: boolean; matchedPath?: string } {
  switch (check) {
    // Next.js
    case "path_in_app_components": {
      const match = paths.find((p) => p.startsWith("app/components/"));
      return { triggered: !!match, matchedPath: match };
    }
    case "missing_lib_folder": {
      const hasLib = paths.some(
        (p) =>
          p.startsWith("lib/") ||
          p.startsWith("utils/") ||
          p.startsWith("src/lib/") ||
          p.startsWith("src/utils/"),
      );
      return { triggered: !hasLib };
    }
    case "api_in_pages": {
      const hasAppRouter = paths.some((p) => p.startsWith("app/"));
      const match = paths.find((p) => p.startsWith("pages/api/"));
      return { triggered: hasAppRouter && !!match, matchedPath: match };
    }
    case "server_action_in_wrong_place": {
      // If "use server" files are outside app/ or lib/ — heuristic via path
      const match = paths.find(
        (p) =>
          p.includes("server") &&
          !p.startsWith("app/") &&
          !p.startsWith("lib/") &&
          (p.endsWith(".ts") || p.endsWith(".tsx")),
      );
      return { triggered: !!match, matchedPath: match };
    }

    // React
    case "components_at_root": {
      const hasRootComponents = paths.some((p) => p.startsWith("components/"));
      const hasSrc = paths.some((p) => p.startsWith("src/"));
      return { triggered: hasRootComponents && hasSrc };
    }
    case "missing_src_folder": {
      const hasSrc = paths.some((p) => p.startsWith("src/"));
      return { triggered: !hasSrc };
    }
    case "hooks_outside_hooks_dir": {
      const match = paths.find(
        (p) =>
          /\/use[A-Z]/.test(p) &&
          !p.includes("/hooks/") &&
          (p.endsWith(".ts") || p.endsWith(".tsx")),
      );
      return { triggered: !!match, matchedPath: match };
    }
    case "styles_scattered": {
      const styleFiles = paths.filter(
        (p) => p.endsWith(".css") || p.endsWith(".scss") || p.endsWith(".sass"),
      );
      if (styleFiles.length < 3) return { triggered: false };
      const dirs = new Set(styleFiles.map((p) => p.split("/")[0]));
      return { triggered: dirs.size >= 3 };
    }

    // Generic
    case "excessive_nesting": {
      const match = paths.find((p) => p.split("/").length > 5);
      return { triggered: !!match, matchedPath: match };
    }
    case "missing_readme": {
      const hasReadme = paths.some((p) => p.toLowerCase().startsWith("readme"));
      return { triggered: !hasReadme };
    }
    case "config_files_scattered": {
      const match = paths.find(
        (p) =>
          p.includes("/") &&
          (p.endsWith(".env") ||
            p.includes(".env.") ||
            p.endsWith(".config.js") ||
            p.endsWith(".config.ts")),
      );
      return { triggered: !!match, matchedPath: match };
    }
    case "test_files_mixed": {
      const testFiles = paths.filter(
        (p) =>
          (p.includes(".test.") || p.includes(".spec.")) &&
          !p.includes("__tests__/") &&
          !p.includes("/tests/"),
      );
      return { triggered: testFiles.length > 2 };
    }

    default:
      return { triggered: false };
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function analyseStructure(filePaths: string[]): StructureResult {
  const framework = detectFramework(filePaths);

  // Select rule set based on framework
  let rules: RuleDefinition[];
  if (framework === "Next.js") {
    rules = [
      ...(nextjsRules as RuleDefinition[]),
      ...(genericRules as RuleDefinition[]),
    ];
  } else if (framework === "React") {
    rules = [
      ...(reactRules as RuleDefinition[]),
      ...(genericRules as RuleDefinition[]),
    ];
  } else {
    rules = genericRules as RuleDefinition[];
  }

  const findings: StructureFinding[] = [];

  for (const rule of rules) {
    const { triggered, matchedPath } = runCheck(rule.check, filePaths);
    if (triggered) {
      findings.push({
        severity: rule.severity,
        rule: rule.id,
        message: rule.message,
        suggestion: rule.suggestion,
        ...(matchedPath ? { path: matchedPath } : {}),
      });
    }
  }

  // Sort: errors first, then warnings, then info
  const order = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return { framework, findings };
}
