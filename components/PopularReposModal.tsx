"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Star, Code2 } from "lucide-react";
import { POPULAR_REPOS, repoUrl, type PopularRepo } from "@/lib/popular-repos";

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function PopularReposModal({ onSelect, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Guard: createPortal only works client-side (document must exist)
  if (typeof document === "undefined") return null;

  // Render into document.body via a portal so the modal is NEVER trapped
  // inside an ancestor's CSS transform / stacking context (e.g. anim-fade-up).
  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647, // max safe z-index
        background: "rgba(6, 0, 9, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "env(safe-area-inset-top, 1rem) env(safe-area-inset-right, 1rem) env(safe-area-inset-bottom, 1rem) env(safe-area-inset-left, 1rem)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-base)",
          borderRadius: "1.5rem",
          boxShadow:
            "0 8px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12)",
          width: "min(700px, calc(100vw - 2rem))",
          maxHeight: "min(85vh, calc(100dvh - 2rem))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // Explicit centering in case flex fails on older Safari
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-card)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.2rem",
              }}
            >
              Popular Repositories
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Pre-indexed · instant results · no credit used
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid var(--border-card)",
              borderRadius: "0.6rem",
              padding: "0.4rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid */}
        <div
          style={{
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {POPULAR_REPOS.map((r: PopularRepo) => (
            <RepoCard
              key={`${r.owner}/${r.repo}`}
              repo={r}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RepoCard({
  repo,
  onSelect,
}: {
  repo: PopularRepo;
  onSelect: (url: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(repoUrl(repo))}
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-card)",
        borderRadius: "1rem",
        padding: "1rem 1.1rem",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.18s, box-shadow 0.18s, transform 0.18s",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          repo.color + "55";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 20px ${repo.color}18`;
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border-card)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(0)";
      }}
    >
      {/* Top row: dot + label + stars */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: repo.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
            {repo.label}
          </span>
        </div>
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <Star size={10} />
          {repo.stars}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {repo.description}
      </p>

      {/* Footer: owner/repo + language */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.1rem",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {repo.owner}/{repo.repo}
        </span>
        <span
          style={{
            fontSize: "0.68rem",
            color: repo.color,
            background: repo.color + "18",
            border: `1px solid ${repo.color}30`,
            borderRadius: "0.4rem",
            padding: "0.1rem 0.45rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Code2 size={9} />
          {repo.language}
        </span>
      </div>
    </button>
  );
}
