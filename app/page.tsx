"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  FolderTree,
  ShieldCheck,
  ArrowDown,
  ArrowRight,
  Coins,
} from "lucide-react";

const TOOLS = [
  {
    id: "chat",
    Icon: MessageSquare,
    title: "Chat with Codebase",
    desc: "Ask anything about any public GitHub repository. Get context-aware answers grounded in the actual source code.",
    badge: "Popular",
    color: "#8b5cf6",
  },
  {
    id: "structure",
    Icon: FolderTree,
    title: "Structure Analyser",
    desc: "Detect structural anti-patterns, misplaced folders, missing conventions and get actionable fix suggestions.",
    badge: "Insight",
    color: "#0ea5e9",
  },
  {
    id: "security",
    Icon: ShieldCheck,
    title: "Security Review",
    desc: "Scan for OWASP vulnerabilities, hardcoded secrets, injection risks, and insecure patterns in any repo.",
    badge: "Critical",
    color: "#f43f5e",
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 3))
      .catch(() => setCredits(3))
      .finally(() => setCreditsLoading(false));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        overflowX: "hidden",
      }}
    >
      {/* ── Subtle grid background ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.028) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
        }}
      />

      {/* ── Pill header ── */}
      <nav className="pill-nav">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: "1.5rem",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Gitserve
          </span>
        </div>
        <div className="credit-badge">
          <Coins size={13} color="#8b5cf6" style={{ flexShrink: 0 }} />
          {creditsLoading ? (
            <span style={{ opacity: 0.5 }}>…</span>
          ) : (
            <span>{credits} {credits === 1 ? "Credit" : "Credits"}</span>
          )}
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6rem 1.5rem 4rem",
          overflow: "hidden",
        }}
      >
        {/* Blobs */}
        <div
          aria-hidden
          className="hero-blob"
          style={{
            width: 620,
            height: 420,
            top: "8%",
            left: "5%",
            background:
              "radial-gradient(ellipse, rgba(139,92,246,0.28) 0%, transparent 70%)",
            animation: "blob-float 16s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden
          className="hero-blob"
          style={{
            width: 520,
            height: 360,
            top: "18%",
            right: "3%",
            background:
              "radial-gradient(ellipse, rgba(192,38,211,0.18) 0%, transparent 70%)",
            animation: "blob-float 20s ease-in-out infinite reverse",
          }}
        />
        <div
          aria-hidden
          className="hero-blob"
          style={{
            width: 380,
            height: 280,
            bottom: "12%",
            left: "28%",
            background:
              "radial-gradient(ellipse, rgba(157,23,77,0.16) 0%, transparent 70%)",
            animation: "blob-float 12s ease-in-out infinite 1.5s",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          {/* Badge */}
          <div
            className="anim-fade-up delay-100"
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.6rem",
            }}
          >
            <span className="tag-pill">AI-Powered Code Intelligence</span>
          </div>

          {/* Heading */}
          <h1
            className="anim-fade-up delay-200"
            style={{
              fontSize: "clamp(2.6rem, 7.5vw, 5.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: "1.4rem",
              color: "var(--text-primary)",
            }}
          >
            Understand Any
            <br />
            <span className="gradient-text">GitHub Repository</span>
          </h1>

          {/* Sub-heading */}
          <p
            className="anim-fade-up delay-300"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "var(--text-muted)",
              maxWidth: 540,
              lineHeight: 1.75,
              margin: "0 auto 2.75rem",
            }}
          >
            Point Gitserve at any public repo — get instant answers,
            architecture maps, and security insights without reading a single
            line.
          </p>

          {/* CTAs */}
          <div
            className="anim-fade-up delay-400"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.875rem",
            }}
          >
            <button
              className="btn-cta"
              onClick={() =>
                document
                  .getElementById("tools")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started
              <ArrowDown size={16} strokeWidth={2.5} />
            </button>
            <button
              className="btn-ghost"
              onClick={() =>
                document
                  .getElementById("tools")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Tools
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="anim-fade-in delay-700"
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            3 tools · 3 credits
          </span>
          <div
            style={{
              width: 2,
              height: 36,
              background:
                "linear-gradient(to bottom, rgba(139,92,246,0.55), transparent)",
              animation: "glow-pulse 2s ease infinite",
            }}
          />
        </div>
      </section>

      {/* ── Tools section ── */}
      <section
        id="tools"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "6rem 1.5rem 8rem",
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        {/* Divider */}
        <div className="section-divider" style={{ marginBottom: "5rem" }} />

        {/* Section heading */}
        <div
          style={{ textAlign: "center", marginBottom: "4rem" }}
          className="anim-fade-up"
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--accent-primary)",
              textTransform: "uppercase",
              marginBottom: "0.85rem",
            }}
          >
            Choose a Tool
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: "1rem",
            }}
          >
            Three Ways to <span className="gradient-text">Know Your Code</span>
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.05rem",
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            Each tool uses 1 credit.&nbsp;
            {credits !== null
              ? `You have ${credits} credit${credits !== 1 ? "s" : ""} available.`
              : "You have 3 credits available."}
          </p>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {TOOLS.map((tool, i) => (
            <button
              key={tool.id}
              className={`card-tool anim-fade-up delay-${(i + 2) * 100}`}
              onClick={() => router.push(`/tools/${tool.id}`)}
            >
              {/* Icon */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  marginBottom: "1.35rem",
                  background: `${tool.color}16`,
                  border: `1px solid ${tool.color}28`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 22px ${tool.color}1a`,
                }}
              >
                <tool.Icon size={24} color={tool.color} strokeWidth={1.75} />
              </div>

              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: `${tool.color}14`,
                  border: `1px solid ${tool.color}26`,
                  borderRadius: 9999,
                  padding: "0.2rem 0.65rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: tool.color,
                  marginBottom: "0.8rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {tool.badge}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: "0.65rem",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {tool.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.68,
                  marginBottom: "1.75rem",
                }}
              >
                {tool.desc}
              </p>

              {/* Link */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: tool.color,
                }}
              >
                Try it
                <ArrowRight size={14} strokeWidth={2.5} color={tool.color} />
              </div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "3.5rem",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          Works with any public GitHub repository · Credits reset on page
          refresh
        </p>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "2rem 1.5rem 2.5rem",
          borderTop: "1px solid var(--border-base)",
        }}
      >
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            letterSpacing: "0.01em",
          }}
        >
          Made with ❤️ by Nanda Varma
        </p>
      </footer>
    </div>
  );
}
