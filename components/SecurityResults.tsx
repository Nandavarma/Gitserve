"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Settings2,
  FileSearch,
  Bug,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  FileCode,
  Shield,
} from "lucide-react";
import type { SecurityResult } from "./types";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f43f5e",
  medium: "#f59e0b",
  low: "#0ea5e9",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 60
        ? "#f59e0b"
        : score >= 40
          ? "#f43f5e"
          : "#ef4444";
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}
    >
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={`${color}30`}
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 2,
          }}
        >
          Score
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0.875rem",
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon}
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function CategoryRow({
  name,
  checked,
  passed,
}: {
  name: string;
  checked: number;
  passed: number;
}) {
  const pct = checked > 0 ? Math.round((passed / checked) * 100) : 100;
  const color = pct === 100 ? "#22c55e" : pct >= 80 ? "#f59e0b" : "#f43f5e";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 0",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.35rem",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {name}
          </span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color }}>
            {passed}/{checked} passed
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: color,
              borderRadius: 9999,
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SeverityBar({ findings }: { findings: { severity: string }[] }) {
  const total = findings.length || 1;
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  findings.forEach((f) => {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 9999,
          overflow: "hidden",
          marginBottom: "0.5rem",
        }}
      >
        {(["critical", "high", "medium", "low"] as const).map((sev) => {
          if (counts[sev] === 0) return null;
          return (
            <div
              key={sev}
              style={{
                width: `${(counts[sev] / total) * 100}%`,
                background: SEVERITY_COLOR[sev],
                minWidth: 3,
                transition: "width 0.6s ease",
              }}
            />
          );
        })}
        {findings.length === 0 && (
          <div style={{ width: "100%", background: "#22c55e" }} />
        )}
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {(["critical", "high", "medium", "low"] as const).map((sev) => (
          <div
            key={sev}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: SEVERITY_COLOR[sev],
              }}
            />
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              {SEVERITY_LABEL[sev]}: {counts[sev]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  loading: boolean;
  result: SecurityResult | null;
}

export function SecurityResults({ loading, result }: Props) {
  const [findingsExpanded, setFindingsExpanded] = useState(true);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3.5rem 0" }}>
        <Settings2
          size={38}
          color="#f43f5e"
          strokeWidth={1.5}
          style={{
            animation: "spin-slow 3s linear infinite",
            display: "block",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Scanning for security vulnerabilities…
        </p>
      </div>
    );
  }

  if (!result) return null;

  const criticalCount = result.findings.filter(
    (f) => f.severity === "critical",
  ).length;
  const highCount = result.findings.filter((f) => f.severity === "high").length;
  const label =
    result.score >= 80
      ? "Low Risk"
      : result.score >= 60
        ? "Moderate Risk"
        : result.score >= 40
          ? "High Risk"
          : "Critical Risk";
  const labelColor =
    result.score >= 80 ? "#22c55e" : result.score >= 60 ? "#f59e0b" : "#f43f5e";
  const stats = result.stats;

  return (
    <div
      className="anim-fade-up"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* ── Score + Risk Banner ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.75rem",
          background:
            "linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(139,92,246,0.04) 100%)",
          border: "1px solid rgba(244,63,94,0.14)",
          borderRadius: "1rem",
          padding: "1.75rem 2rem",
          flexWrap: "wrap",
        }}
      >
        <ScoreRing score={result.score} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {result.score >= 80 ? (
              <ShieldCheck size={22} color="#22c55e" />
            ) : (
              <ShieldAlert size={22} color="#f43f5e" />
            )}
            <span
              style={{ fontWeight: 800, fontSize: "1.2rem", color: labelColor }}
            >
              {label}
            </span>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              marginBottom: "0.75rem",
            }}
          >
            {result.findings.length} issue
            {result.findings.length !== 1 ? "s" : ""} detected ·{" "}
            {criticalCount + highCount} need immediate attention
          </p>
          <SeverityBar findings={result.findings} />
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {stats && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
          className="anim-fade-up delay-100"
        >
          <StatCard
            icon={<FileSearch size={14} color="#8b5cf6" />}
            label="Files Scanned"
            value={stats.filesScanned}
            sub={
              stats.fileTypes.length > 0
                ? stats.fileTypes
                    .slice(0, 4)
                    .map((f) => `.${f.ext}`)
                    .join(", ")
                : undefined
            }
          />
          <StatCard
            icon={<Bug size={14} color="#f43f5e" />}
            label="Issues Found"
            value={result.findings.length}
            sub={
              result.findings.length === 0
                ? "Clean scan"
                : `${criticalCount} critical, ${highCount} high`
            }
          />
          <StatCard
            icon={<Shield size={14} color="#0ea5e9" />}
            label="Rules Checked"
            value={stats.rulesChecked}
            sub="Security patterns"
          />
          <StatCard
            icon={<Lock size={14} color="#22c55e" />}
            label="Categories"
            value={stats.categories.length}
            sub={`${stats.categories.filter((c) => c.passed === c.checked).length} fully passed`}
          />
        </div>
      )}

      {/* ── Category Breakdown ── */}
      {stats && stats.categories.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
          }}
          className="anim-fade-up delay-200"
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Eye size={13} /> Security Categories
          </p>
          {stats.categories.map((cat, i) => (
            <CategoryRow
              key={i}
              name={cat.name}
              checked={cat.checked}
              passed={cat.passed}
            />
          ))}
        </div>
      )}

      {/* ── File Types Scanned ── */}
      {stats && stats.fileTypes.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
          }}
          className="anim-fade-up delay-300"
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FileCode size={13} /> Files Analyzed by Type
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {stats.fileTypes.map((ft) => (
              <div
                key={ft.ext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.16)",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.7rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "#c4b5fd",
                    fontWeight: 600,
                  }}
                >
                  .{ft.ext}
                </span>
                <span
                  style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                >
                  {ft.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Risk Summary ── */}
      {result.summary && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(244,63,94,0.05) 0%, rgba(244,63,94,0.02) 100%)",
            border: "1px solid rgba(244,63,94,0.14)",
            borderRadius: "1rem",
            padding: "1.4rem 1.6rem",
          }}
          className="anim-fade-up delay-300"
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#f43f5e",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "0.65rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <MessageSquare size={13} /> Risk Summary
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
        <div className="anim-fade-up delay-400">
          <button
            onClick={() => setFindingsExpanded((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: findingsExpanded ? "1rem 1rem 0 0" : "1rem",
              padding: "0.85rem 1.25rem",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "border-radius 0.2s",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <AlertTriangle size={15} color="#f59e0b" />
              <span>Detailed Findings ({result.findings.length})</span>
            </div>
            {findingsExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          {findingsExpanded && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "none",
                borderRadius: "0 0 1rem 1rem",
                overflow: "hidden",
              }}
            >
              {result.findings.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1rem 1.3rem",
                    background: "rgba(0,0,0,0.2)",
                    borderLeft: `3px solid ${SEVERITY_COLOR[f.severity]}`,
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
                          {SEVERITY_LABEL[f.severity]}
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
                              wordBreak: "break-all",
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
                          marginBottom: f.snippet ? "0.45rem" : "0.4rem",
                          fontWeight: 500,
                        }}
                      >
                        {f.message}
                      </p>
                      {f.snippet && (
                        <pre
                          style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                            fontSize: "0.75rem",
                            background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            color: "#c4b5fd",
                            overflowX: "auto",
                            marginBottom: "0.4rem",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {f.snippet.slice(0, 160)}
                          {f.snippet.length > 160 ? "…" : ""}
                        </pre>
                      )}
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                          lineHeight: 1.6,
                        }}
                      >
                        🔒 {f.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="anim-fade-up delay-400"
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
            No obvious vulnerabilities found!
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No secrets, risky patterns, or known vulnerabilities detected.
          </p>
        </div>
      )}
    </div>
  );
}
