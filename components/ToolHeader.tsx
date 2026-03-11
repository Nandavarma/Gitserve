"use client";

import { ArrowLeft, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ToolConfig } from "./types";

interface Props {
  config: ToolConfig;
  credits: number;
  creditsLoading: boolean;
}

export function ToolHeader({ config, credits, creditsLoading }: Props) {
  const router = useRouter();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(6,0,9,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border-base)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <button
        onClick={() => router.push("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.38rem 0.7rem",
          borderRadius: 9999,
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-primary)";
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(139,92,246,0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-muted)";
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        <ArrowLeft size={15} strokeWidth={2.5} />
        Back
      </button>

      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--border-base)",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontWeight: 800,
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        Gitserve
      </span>

      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--border-base)",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          minWidth: 0,
        }}
      >
        <config.Icon
          size={16}
          color={config.color}
          strokeWidth={1.75}
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {config.name}
        </span>
      </div>

      <div className="credit-badge">
        <Coins size={13} color={config.color} style={{ flexShrink: 0 }} />
        {creditsLoading ? (
          <span style={{ opacity: 0.5 }}>…</span>
        ) : (
          <span>
            {credits} {credits === 1 ? "Credit" : "Credits"}
          </span>
        )}
      </div>
    </header>
  );
}
