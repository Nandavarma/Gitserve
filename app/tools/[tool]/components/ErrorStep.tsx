"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorStep({ message, onRetry }: Props) {
  return (
    <div className="anim-fade-up" style={{ width: "100%", marginTop: "4rem" }}>
      <div
        style={{
          background: "rgba(244,63,94,0.05)",
          border: "1px solid rgba(244,63,94,0.2)",
          borderRadius: "1.5rem",
          padding: "2.75rem 2.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.24)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <AlertTriangle size={28} color="#f43f5e" strokeWidth={1.75} />
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#f43f5e",
            marginBottom: "0.75rem",
          }}
        >
          Something went wrong
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
          {message}
        </p>
        <button className="btn-cta" onClick={onRetry}>
          Try Again
        </button>
      </div>
    </div>
  );
}
