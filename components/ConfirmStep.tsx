"use client";

import { ArrowLeft, Coins, AlertTriangle, Search } from "lucide-react";

interface Props {
  repoUrl: string;
  credits: number;
  resetAt: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

export function ConfirmStep({
  repoUrl,
  credits,
  resetAt,
  onBack,
  onConfirm,
}: Props) {
  // Compute hours until reset statically from the prop value
  let hoursUntilReset = 24;
  if (resetAt) {
    const ms = new Date(resetAt).getTime() - new Date().getTime();
    hoursUntilReset = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
  }

  return (
    <div className="anim-fade-up" style={{ width: "100%", marginTop: "3rem" }}>
      <div
        style={{
          background: "rgba(139,92,246,0.05)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "1.5rem",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <Search size={24} color="#8b5cf6" strokeWidth={1.75} />
        </div>

        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "1.25rem",
          }}
        >
          Ready to Analyse
        </h2>

        {/* Repository URL */}
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            margin: "0 auto 1.25rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(139,92,246,0.12)",
            borderRadius: "0.75rem",
            padding: "0.65rem 1rem",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            wordBreak: "break-all",
            textAlign: "left",
          }}
        >
          {repoUrl}
        </div>

        {credits > 0 ? (
          <>
            {/* Credit info row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "0.6rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                <Coins size={15} color="#8b5cf6" />
                <span>
                  Uses{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    1 credit
                  </strong>
                </span>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {credits} remaining
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "1.75rem",
              }}
            >
              Credits reset in ~{hoursUntilReset}h
            </p>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button className="btn-ghost" onClick={onBack}>
                <ArrowLeft size={14} /> Back
              </button>
              <button className="btn-cta" onClick={() => onConfirm()}>
                Confirm · Use 1 Credit
              </button>
            </div>
          </>
        ) : (
          <div style={{ marginTop: "1.25rem" }}>
            <p
              style={{
                color: "#f43f5e",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <AlertTriangle size={16} color="#f43f5e" /> No credits remaining.
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                marginBottom: "1.25rem",
              }}
            >
              Resets in ~{hoursUntilReset}h · Credits are shared across all
              browsers on your IP
            </p>
            <button className="btn-ghost" onClick={onBack}>
              <ArrowLeft size={14} /> Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
