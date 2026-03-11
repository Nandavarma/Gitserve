"use client";

import { useState, useCallback } from "react";
import {
  FolderTree,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  Copy,
  Check,
  Eye,
  Code,
  FolderOpen,
  FileText,
  Layers,
} from "lucide-react";
import type { StructureResult } from "./types";

const SEVERITY_COLOR: Record<string, string> = {
  error: "#f43f5e",
  warning: "#f59e0b",
  info: "#0ea5e9",
};

interface Props {
  loading: boolean;
  result: StructureResult | null;
}

function TreePreview({ tree }: { tree: string }) {
  const lines = tree.split("\n");
  return (
    <div
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: "0.82rem",
        lineHeight: 1.7,
      }}
    >
      {lines.map((line, i) => {
        const isDir = line.trimEnd().endsWith("/");
        const name = line.replace(/^[│├└─\s]+/, "").replace(/\/$/, "");
        const prefix = line.slice(
          0,
          line.length - name.length - (isDir ? 1 : 0),
        );
        return (
          <div key={i} style={{ whiteSpace: "pre", display: "flex" }}>
            <span style={{ color: "var(--text-muted)", userSelect: "none" }}>
              {prefix}
            </span>
            {isDir ? (
              <span style={{ color: "#8b5cf6", fontWeight: 600 }}>
                <FolderOpen
                  size={12}
                  style={{
                    display: "inline",
                    marginRight: 4,
                    verticalAlign: "middle",
                    marginTop: -2,
                  }}
                />
                {name}/
              </span>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>
                <FileText
                  size={11}
                  style={{
                    display: "inline",
                    marginRight: 4,
                    verticalAlign: "middle",
                    marginTop: -2,
                    opacity: 0.5,
                  }}
                />
                {name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StructureResults({ loading, result }: Props) {
  const [treeTab, setTreeTab] = useState<"preview" | "markdown">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!result?.folderTree) return;
    const markdown = "```\n" + result.folderTree + "\n```";
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3.5rem 0" }}>
        <Settings2
          size={38}
          color="#0ea5e9"
          strokeWidth={1.5}
          style={{
            animation: "spin-slow 3s linear infinite",
            display: "block",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Running rule-based structure analysis…
        </p>
      </div>
    );
  }

  if (!result) return null;

  const errorCount = result.findings.filter(
    (f) => f.severity === "error",
  ).length;
  const warningCount = result.findings.filter(
    (f) => f.severity === "warning",
  ).length;
  const infoCount = result.findings.filter((f) => f.severity === "info").length;

  return (
    <div
      className="anim-fade-up"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* ── Header Stats Row ── */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 160px",
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(139,92,246,0.04) 100%)",
            border: "1px solid rgba(14,165,233,0.16)",
            borderRadius: "0.875rem",
            padding: "1rem 1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <FolderTree size={20} color="#0ea5e9" style={{ flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              Framework
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {result.framework}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: "1 1 120px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "0.875rem",
            padding: "1rem 1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Layers size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              Issues Found
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: result.findings.length > 0 ? "#f59e0b" : "#22c55e",
              }}
            >
              {result.findings.length}
            </div>
          </div>
        </div>

        {result.findings.length > 0 && (
          <div
            style={{
              flex: "1 1 200px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.875rem",
              padding: "1rem 1.1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            {errorCount > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: SEVERITY_COLOR.error,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: SEVERITY_COLOR.error,
                  }}
                />
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </span>
            )}
            {warningCount > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: SEVERITY_COLOR.warning,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: SEVERITY_COLOR.warning,
                  }}
                />
                {warningCount} warn
              </span>
            )}
            {infoCount > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: SEVERITY_COLOR.info,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: SEVERITY_COLOR.info,
                  }}
                />
                {infoCount} info
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Folder Tree with Toggle ── */}
      {result.folderTree && (
        <div
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
          className="anim-fade-up delay-100"
        >
          {/* Tab header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "0 0.25rem",
            }}
          >
            <div style={{ display: "flex" }}>
              <button
                onClick={() => setTreeTab("preview")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.7rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color:
                    treeTab === "preview"
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    treeTab === "preview"
                      ? "2px solid #8b5cf6"
                      : "2px solid transparent",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={() => setTreeTab("markdown")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.7rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color:
                    treeTab === "markdown"
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    treeTab === "markdown"
                      ? "2px solid #8b5cf6"
                      : "2px solid transparent",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                <Code size={14} /> Markdown
              </button>
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.4rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: copied ? "#22c55e" : "var(--text-muted)",
                background: copied
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "0.5rem",
                cursor: "pointer",
                marginRight: "0.5rem",
                transition: "all 0.2s",
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Tab content */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {treeTab === "preview" ? (
              <TreePreview tree={result.folderTree} />
            ) : (
              <pre
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: "0.82rem",
                  color: "#c4b5fd",
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: "pre",
                  overflowX: "auto",
                }}
              >
                {"```\n"}
                {result.folderTree}
                {"\n```"}
              </pre>
            )}
          </div>

          {/* Add to README hint */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "0.75rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(139,92,246,0.04)",
            }}
          >
            <FolderTree size={13} color="#8b5cf6" />
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Add this folder structure to your{" "}
              <strong style={{ color: "var(--text-secondary)" }}>
                README.md
              </strong>{" "}
              to help contributors navigate the codebase. Click{" "}
              <strong style={{ color: "var(--text-secondary)" }}>Copy</strong>{" "}
              to grab the markdown.
            </span>
          </div>
        </div>
      )}

      {/* ── AI Summary ── */}
      {result.summary && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(14,165,233,0.02) 100%)",
            border: "1px solid rgba(14,165,233,0.14)",
            borderRadius: "1rem",
            padding: "1.4rem 1.6rem",
          }}
          className="anim-fade-up delay-200"
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#0ea5e9",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "0.65rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <MessageSquare size={13} /> AI Summary
          </p>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.72,
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.summary}
          </p>
        </div>
      )}

      {/* ── Findings ── */}
      {result.findings.length > 0 ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          className="anim-fade-up delay-300"
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <AlertTriangle size={13} /> Structural Issues
          </p>
          {result.findings.map((f, i) => (
            <div
              key={i}
              style={{
                background: "rgba(0,0,0,0.2)",
                borderLeft: `3px solid ${SEVERITY_COLOR[f.severity]}`,
                borderRadius: "0 0.75rem 0.75rem 0",
                padding: "1rem 1.2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.65rem",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: SEVERITY_COLOR[f.severity],
                        letterSpacing: "0.06em",
                        background: `${SEVERITY_COLOR[f.severity]}18`,
                        borderRadius: 4,
                        padding: "0.12rem 0.45rem",
                      }}
                    >
                      {f.severity}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      {f.rule}
                    </span>
                    {f.path && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-geist-mono), monospace",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 4,
                          padding: "0.15rem 0.4rem",
                        }}
                      >
                        {f.path}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.875rem",
                      marginBottom: "0.4rem",
                      fontWeight: 500,
                    }}
                  >
                    {f.message}
                  </p>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                    }}
                  >
                    💡 {f.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="anim-fade-up delay-300"
          style={{
            textAlign: "center",
            padding: "2.5rem",
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)",
            border: "1px solid rgba(34,197,94,0.14)",
            borderRadius: "1rem",
          }}
        >
          <CheckCircle2
            size={40}
            color="#22c55e"
            style={{
              display: "block",
              margin: "0 auto 0.75rem",
              filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))",
            }}
          />
          <p
            style={{
              color: "#22c55e",
              fontWeight: 700,
              fontSize: "1.05rem",
              marginBottom: "0.35rem",
            }}
          >
            Structure looks good!
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No structural issues detected for this project.
          </p>
        </div>
      )}
    </div>
  );
}
