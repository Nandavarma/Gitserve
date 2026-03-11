"use client";

import { GitBranch, FolderTree, Search, Settings2, Database, CheckCheck } from "lucide-react";
import type { ToolConfig } from "./types";

const INGEST_STEPS = [
  { label: "Connecting to GitHub", Icon: GitBranch, pct: 5 },
  { label: "Fetching repository tree", Icon: FolderTree, pct: 15 },
  { label: "Reading source files", Icon: Search, pct: 40 },
  { label: "Generating embeddings", Icon: Settings2, pct: 75 },
  { label: "Indexing to vector store", Icon: Database, pct: 95 },
];

interface Props {
  config: ToolConfig;
  progress: number;
  stepIdx: number;
}

export function IngestingStep({ config, progress, stepIdx }: Props) {
  const { color } = config;

  return (
    <div
      className="anim-fade-up"
      style={{ width: "100%", marginTop: "3rem", textAlign: "center" }}
    >
      {/* ── Orbital animation ── */}
      <div
        style={{
          position: "relative",
          width: 240,
          height: 240,
          margin: "0 auto 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `1px solid ${color}20`,
            animation: "pulse-ring 3.5s ease-in-out infinite",
          }}
        />
        {/* Middle ring */}
        <div
          style={{
            position: "absolute",
            width: 165,
            height: 165,
            borderRadius: "50%",
            border: `1px solid ${color}30`,
            animation: "pulse-ring 3.5s ease-in-out infinite 0.6s",
          }}
        />
        {/* Inner ring with orbiting dot */}
        <div
          style={{
            position: "absolute",
            width: 118,
            height: 118,
            borderRadius: "50%",
            border: `1px solid ${color}40`,
            animation: "orbit-spin 6s linear infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -5,
              left: "calc(50% - 5px)",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
        {/* Second orbiting dot (opposite direction, smaller ring) */}
        <div
          style={{
            position: "absolute",
            width: 90,
            height: 90,
            borderRadius: "50%",
            border: "none",
            animation: "orbit-spin-rev 4s linear infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "calc(50% - 4px)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: `${color}cc`,
              boxShadow: `0 0 6px ${color}aa`,
            }}
          />
        </div>

        {/* Central orb */}
        <div
          style={{
            position: "relative",
            width: 72,
            height: 72,
            borderRadius: "1.25rem",
            background: `linear-gradient(135deg, ${color}22, ${color}10)`,
            border: `1px solid ${color}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px ${color}25, 0 0 80px ${color}12`,
            animation: "orb-glow 3s ease-in-out infinite",
            overflow: "hidden",
          }}
        >
          {/* Scan sweep line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(to right, transparent, ${color}cc, transparent)`,
              animation: "scan-sweep 2.4s linear infinite",
            }}
          />
          <config.Icon size={30} color={color} strokeWidth={1.5} />
        </div>
      </div>

      <h2
        style={{
          fontSize: "1.6rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: "0.45rem",
        }}
      >
        Analysing Repository
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "2rem",
          fontSize: "0.9rem",
          minHeight: "1.4rem",
        }}
      >
        {INGEST_STEPS[stepIdx]?.label ?? "Processing"}…
      </p>

      {/* Progress bar */}
      <div
        className="progress-track"
        style={{ maxWidth: 420, margin: "0 auto 0.65rem" }}
      >
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "2.25rem" }}>
        {Math.round(progress)}% · Large repositories may take 1–3 minutes
      </p>

      {/* Step pills */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.45rem",
          flexWrap: "wrap",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        {INGEST_STEPS.map((step, i) => {
          const StepIcon = step.Icon;
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.72rem",
                padding: "0.28rem 0.7rem",
                borderRadius: 9999,
                background:
                  done || active
                    ? `${color}1a`
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${done || active ? color + "38" : "rgba(255,255,255,0.06)"}`,
                color: done || active ? color : "var(--text-muted)",
                transition: "all 0.4s ease",
                fontWeight: active ? 700 : 400,
              }}
            >
              {done ? <CheckCheck size={11} /> : <StepIcon size={11} />}
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
