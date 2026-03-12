"use client";

import { useState } from "react";
import type { ToolConfig } from "./types";
import { PopularReposModal } from "./PopularReposModal";

interface Props {
  config: ToolConfig;
  repoUrl: string;
  onRepoUrlChange: (v: string) => void;
  onSubmit: () => void;
  onSelectPopular: (url: string) => void;
}

export function InputStep({
  config,
  repoUrl,
  onRepoUrlChange,
  onSubmit,
  onSelectPopular,
}: Props) {
  const [showPopular, setShowPopular] = useState(false);
  return (
    <div
      className="anim-fade-up"
      style={{ width: "100%", marginTop: "2.5rem" }}
    >
      {/* Hero card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${config.color}0e, rgba(157,23,77,0.04))`,
          border: `1px solid ${config.color}1e`,
          borderRadius: "1.5rem",
          padding: "2.5rem 1.75rem",
          textAlign: "center",
          marginBottom: "2.25rem",
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "1.35rem",
            background: `${config.color}14`,
            border: `1px solid ${config.color}24`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.35rem",
            boxShadow: `0 0 40px ${config.color}22`,
          }}
        >
          <config.Icon size={34} color={config.color} strokeWidth={1.5} />
        </div>
        <h1
          style={{
            fontSize: "1.9rem",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            marginBottom: "0.8rem",
          }}
        >
          {config.name}
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            lineHeight: 1.72,
            maxWidth: 480,
            margin: "0 auto",
            fontSize: "0.95rem",
          }}
        >
          {config.description}
        </p>
      </div>

      {/* URL form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (repoUrl.trim()) onSubmit();
        }}
      >
        {/* Popular repos trigger — full-width button above the input */}
        <button
          type="button"
          onClick={() => setShowPopular(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0.75rem 1.25rem",
            marginBottom: "1rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(157,23,77,0.12))",
            border: "1px solid rgba(139,92,246,0.45)",
            borderRadius: "0.85rem",
            cursor: "pointer",
            letterSpacing: "0.01em",
            transition:
              "background 0.18s, border-color 0.18s, box-shadow 0.18s",
            boxShadow: "0 0 18px rgba(139,92,246,0.15)",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background =
              "linear-gradient(135deg, rgba(139,92,246,0.28), rgba(157,23,77,0.18))";
            b.style.borderColor = "rgba(139,92,246,0.7)";
            b.style.boxShadow = "0 0 28px rgba(139,92,246,0.3)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background =
              "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(157,23,77,0.12))";
            b.style.borderColor = "rgba(139,92,246,0.45)";
            b.style.boxShadow = "0 0 18px rgba(139,92,246,0.15)";
          }}
        >
          Choose Popular Repo
        </button>

        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: "0.75rem",
          }}
        >
          or enter a GitHub Repository URL
        </label>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            className="input-repo"
            style={{ flex: "1 1 240px", minWidth: 0 }}
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => onRepoUrlChange(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn-cta"
            style={{ flexShrink: 0, width: "auto" }}
            disabled={!repoUrl.trim()}
          >
            Analyse
          </button>
        </div>
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            marginTop: "0.6rem",
          }}
        >
          Supports any public GitHub repository · up to 100 source files indexed
        </p>
      </form>

      {showPopular && (
        <PopularReposModal
          onSelect={(url) => {
            setShowPopular(false);
            onSelectPopular(url);
          }}
          onClose={() => setShowPopular(false)}
        />
      )}
    </div>
  );
}
