/**
 * lib/security.ts
 * Rule-based security scanner for repository content.
 *
 * Supabase table required:
 *   CREATE TABLE user_credits (
 *     fingerprint TEXT PRIMARY KEY,
 *     credits     INTEGER NOT NULL DEFAULT 3,
 *     reset_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
 *   );
 */

export interface SecurityFinding {
  severity: "critical" | "high" | "medium" | "low";
  rule: string;
  message: string;
  suggestion: string;
  path?: string;
  snippet?: string;
}

interface SecurityRule {
  id: string;
  severity: SecurityFinding["severity"];
  description: string;
  suggestion: string;
  /** Regex tested against file content */
  contentPattern?: RegExp;
  /** Regex tested against file path */
  pathPattern?: RegExp;
  /** Paths that match pathPattern but also match this are excluded */
  pathExclude?: RegExp;
}

const SECURITY_RULES: SecurityRule[] = [
  // ── Committed secrets / config files ────────────────────────────────────
  {
    id: "committed-env-file",
    severity: "critical",
    description: "Committed environment file — may contain live secrets",
    suggestion:
      "Add .env* to .gitignore, rotate any exposed secrets immediately, and use a secrets manager.",
    pathPattern: /(^|\/)\.(env)(\.[^./]+)?$/i,
    pathExclude: /\.env\.example$/i,
  },
  {
    id: "committed-private-key",
    severity: "critical",
    description: "Private key material committed to repository",
    suggestion:
      "Remove the key, rotate it immediately, and load keys from environment variables or a secrets manager.",
    contentPattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  },

  // ── Hardcoded credentials ────────────────────────────────────────────────
  {
    id: "aws-access-key",
    severity: "critical",
    description: "AWS access key ID detected",
    suggestion:
      "Revoke this key immediately in AWS IAM, then use IAM roles or environment variables.",
    contentPattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: "hardcoded-api-key",
    severity: "high",
    description: "Hardcoded API key or secret in source code",
    suggestion: "Move secrets to environment variables and load with process.env.",
    contentPattern:
      /(?:api[_-]?key|apikey|api[_-]?secret|client[_-]?secret)\s*[:=]\s*['"`](?!process\.env)[A-Za-z0-9_\-./+=]{16,}['"`]/i,
  },
  {
    id: "hardcoded-jwt-secret",
    severity: "high",
    description: "Hardcoded JWT / session / auth secret",
    suggestion:
      "Generate a strong random secret (e.g., openssl rand -hex 32) and load it from an environment variable.",
    contentPattern:
      /(?:jwt[_-]?secret|session[_-]?secret|auth[_-]?secret|nextauth[_-]?secret)\s*[:=]\s*['"`](?!process\.env)[^'"`\s]{8,}['"`]/i,
  },
  {
    id: "hardcoded-password",
    severity: "high",
    description: "Hardcoded password in source code",
    suggestion: "Replace literal passwords with environment variables.",
    contentPattern:
      /(?:^|[^a-z])(?:password|passwd|pwd)\s*[:=]\s*['"`](?!process\.env|<|{)[^'"`\s]{4,}['"`]/im,
  },
  {
    id: "credentials-in-url",
    severity: "high",
    description: "Credentials embedded in a connection URL",
    suggestion:
      "Extract credentials from the URL and supply them via environment variables.",
    contentPattern: /https?:\/\/[^@\s/"]{2,}:[^@\s/"]{2,}@[a-zA-Z0-9]/,
  },

  // ── Dangerous code patterns ──────────────────────────────────────────────
  {
    id: "eval-usage",
    severity: "medium",
    description: "eval() usage — potential remote code execution vector",
    suggestion:
      "Avoid eval(). Use JSON.parse() for JSON data or refactor the logic to avoid dynamic evaluation.",
    contentPattern: /\beval\s*\(/,
  },
  {
    id: "sql-injection-risk",
    severity: "medium",
    description: "Dynamic SQL query built with user-controlled input",
    suggestion:
      "Use parameterized queries or an ORM to prevent SQL injection attacks.",
    contentPattern:
      /(?:query|execute|db\.run|client\.query)\s*\(\s*[`'""][^`'"]*\$\{|(?:query|execute)\s*\(\s*['"`][^'"`]*['"`]\s*\+\s*(?:req\.|params\.|body\.)/i,
  },
  {
    id: "xss-innerhtml",
    severity: "medium",
    description: "Unsanitized innerHTML assignment — XSS risk",
    suggestion:
      "Sanitize content with DOMPurify before assigning to innerHTML, or use dangerouslySetInnerHTML only with trusted, sanitized content.",
    contentPattern: /\.innerHTML\s*=/,
  },
  {
    id: "command-injection-risk",
    severity: "medium",
    description: "exec() / execSync() called with potentially dynamic argument",
    suggestion:
      "Use child_process.execFile() with a fixed command and escaped arguments, or use a library that avoids shell interpolation.",
    contentPattern: /\bexec(?:Sync)?\s*\(\s*(?:[`'"])[^'"`]*\$\{/,
  },
  {
    id: "path-traversal-risk",
    severity: "medium",
    description: "File path built from user input without sanitisation",
    suggestion:
      "Validate and sanitise paths with path.resolve() + path.relative() to prevent directory traversal attacks.",
    contentPattern:
      /(?:readFile|writeFile|createReadStream|createWriteStream)\s*\([^)]*(?:req\.|params\.|body\.|query\.)/i,
  },

  // ── Weak crypto / auth ───────────────────────────────────────────────────
  {
    id: "weak-crypto-md5-sha1",
    severity: "low",
    description: "MD5 or SHA-1 used — cryptographically broken for security purposes",
    suggestion:
      "Replace MD5/SHA-1 with SHA-256 or SHA-512 for security-sensitive hashing. Use bcrypt/argon2 for passwords.",
    contentPattern: /createHash\s*\(\s*['"`](?:md5|sha1)['"`]\)/i,
  },
  {
    id: "disabled-ssl-verification",
    severity: "medium",
    description: "SSL/TLS certificate verification disabled",
    suggestion:
      "Never disable certificate verification in production. Provide the correct CA bundle instead.",
    contentPattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"`]?0['"`]?/,
  },
  {
    id: "cors-wildcard",
    severity: "low",
    description: "CORS configured with wildcard origin (*)",
    suggestion:
      "Restrict CORS to specific trusted origins instead of using the wildcard.",
    contentPattern: /origin\s*:\s*['"`]\*['"`]|Access-Control-Allow-Origin.*\*/,
  },
];

// ────────────────────────────────────────────────────────────────────────────

/**
 * Scan a single chunk (already extracted from the `[filepath]\ncontent` format).
 */
export function scanChunk(filePath: string, content: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const rule of SECURITY_RULES) {
    // Path-based rules
    if (rule.pathPattern) {
      if (rule.pathPattern.test(filePath)) {
        if (rule.pathExclude && rule.pathExclude.test(filePath)) continue;
        findings.push({
          severity: rule.severity,
          rule: rule.id,
          message: rule.description,
          suggestion: rule.suggestion,
          path: filePath,
        });
      }
      continue; // path rules don't also check content
    }

    // Content-based rules
    if (rule.contentPattern) {
      const match = rule.contentPattern.exec(content);
      if (match) {
        // Extract a small surrounding snippet (safe, no raw secrets in critical rules)
        const isSensitive =
          rule.severity === "critical" &&
          (rule.id === "hardcoded-api-key" ||
            rule.id === "hardcoded-jwt-secret" ||
            rule.id === "hardcoded-password" ||
            rule.id === "aws-access-key");

        let snippet: string | undefined;
        if (!isSensitive) {
          const start = Math.max(0, match.index - 40);
          const end = Math.min(content.length, match.index + match[0].length + 60);
          snippet = content.slice(start, end).replace(/\n/g, " ").trim();
        }

        findings.push({
          severity: rule.severity,
          rule: rule.id,
          message: rule.description,
          suggestion: rule.suggestion,
          path: filePath,
          snippet,
        });
      }
    }
  }

  return findings;
}

/**
 * Calculate a 0–100 security score from findings.
 * Higher = safer.
 */
export function calculateScore(findings: SecurityFinding[]): number {
  const penalty = findings.reduce((acc, f) => {
    const p = { critical: 30, high: 18, medium: 8, low: 3 }[f.severity] ?? 0;
    return acc + p;
  }, 0);
  return Math.max(0, 100 - penalty);
}
