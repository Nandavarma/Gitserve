"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { ToolHeader } from "../../../components/ToolHeader";
import { InputStep } from "../../../components/InputStep";
import { ConfirmStep } from "../../../components/ConfirmStep";
import { IngestingStep } from "../../../components/IngestingStep";
import { ErrorStep } from "../../../components/ErrorStep";
import { ChatInterface } from "../../../components/ChatInterface";
import { StructureResults } from "../../../components/StructureResults";
import { SecurityResults } from "../../../components/SecurityResults";
import type {
  PageState,
  Message,
  StructureResult,
  SecurityResult,
  ToolConfig,
} from "../../../components/types";

/* ─── Tool configuration ─────────────────────────────────────────────────── */
const TOOL_CONFIG = {
  chat: {
    name: "Chat with Codebase",
    Icon: MessageSquare,
    color: "#8b5cf6",
    description:
      "Ask anything about any public GitHub repository. Our AI indexes the code and answers your questions with full source context.",
    toolRole: "chat",
    mode: "chat" as const,
    suggestedQuestions: [
      "What does this repository do?",
      "What are the main entry points?",
      "How is authentication handled?",
      "Are there any scaling suggestions?",
      "How can I get started contributing?",
    ],
  },
  structure: {
    name: "Structure Analyser",
    Icon: FolderTree,
    color: "#0ea5e9",
    description:
      "Detect structural anti-patterns, misplaced folders, and missing conventions. Get actionable fix suggestions backed by rule-based analysis.",
    toolRole: "structure",
    mode: "structure" as const,
    suggestedQuestions: [] as string[],
  },
  security: {
    name: "Security Review",
    Icon: ShieldCheck,
    color: "#f43f5e",
    description:
      "Scan for hardcoded secrets, OWASP vulnerabilities, injection risks, committed .env files, and insecure patterns across the entire codebase.",
    toolRole: "security",
    mode: "security" as const,
    suggestedQuestions: [] as string[],
  },
} as const satisfies Record<string, ToolConfig>;

type ToolId = keyof typeof TOOL_CONFIG;

const INGEST_STEP_COUNT = 5;

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ToolPage() {
  const params = useParams();
  const rawTool = params.tool as string;
  const toolId = (rawTool in TOOL_CONFIG ? rawTool : "chat") as ToolId;
  const config = TOOL_CONFIG[toolId];

  /* ── State ── */
  const [pageState, setPageState] = useState<PageState>("input");
  const [repoUrl, setRepoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [repoId, setRepoId] = useState("");

  // Credits (server-side)
  const [credits, setCredits] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [resetAt, setResetAt] = useState<string | null>(null);

  // Ingestion progress
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState(5);

  // Tool results
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureResult, setStructureResult] =
    useState<StructureResult | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityResult, setSecurityResult] = useState<SecurityResult | null>(
    null,
  );

  /* ── Load credits on mount ── */
  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        setCredits(d.credits ?? 0);
        setResetAt(d.resetAt ?? null);
      })
      .catch(() => setCredits(3))
      .finally(() => setCreditsLoading(false));
  }, []);

  /* ── Consume a credit (server-side) ── */
  async function consumeCredit(): Promise<boolean> {
    const res = await fetch("/api/credits", { method: "POST" });
    const d = await res.json();
    if (!res.ok || !d.ok) return false;
    setCredits(d.credits);
    return true;
  }

  /* ── Ingestion ──
   * targetUrl  – when provided, use this URL instead of the state value
   *              (popular repos pass their URL directly; no confirm step)
   * skipCredit – true when the repo is expected to already be cached
   *              (popular repos).  If the API returns cached:true we never
   *              charge regardless; otherwise we charge normally.
   * ── */
  async function startIngestion(targetUrl?: string, skipCredit = false) {
    const urlToIndex = targetUrl ?? repoUrl;

    if (!skipCredit) {
      const ok = await consumeCredit();
      if (!ok) {
        setErrorMsg("No credits remaining. Credits reset every 24 hours.");
        setPageState("error");
        return;
      }
    }

    setPageState("ingesting");
    setProgress(0);
    setStepIdx(0);

    let elapsed = 0;
    const totalMs = skipCredit ? 8_000 : 90_000; // cached repos load fast
    const stepPcts = [5, 15, 40, 75, 95];
    timerRef.current = setInterval(() => {
      elapsed += 300;
      const rawPct = Math.min(94, (elapsed / totalMs) * 100);
      setProgress(rawPct);
      const idx = stepPcts.findIndex((p) => p > rawPct);
      setStepIdx(Math.max(0, (idx === -1 ? INGEST_STEP_COUNT : idx) - 1));
    }, 300);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: urlToIndex }),
      });

      clearInterval(timerRef.current!);

      if (!res.ok) {
        // If we skipped credit and the request failed, charge nothing.
        // If we already charged and it failed, refresh the server counter.
        if (!skipCredit) {
          fetch("/api/credits")
            .then((r) => r.json())
            .then((d) => setCredits(d.credits ?? 0));
        }
        const d = await res.json().catch(() => ({}));
        setErrorMsg(d.error ?? "Failed to analyse the repository.");
        setPageState("error");
        return;
      }

      const data = await res.json();

      // Repo was served from cache — no credit needed, refund if charged
      if (data.cached && !skipCredit) {
        // Refund the credit we pre-charged (best-effort; fire-and-forget)
        fetch("/api/credits", { method: "DELETE" })
          .then((r) => r.json())
          .then((d) => {
            if (d.credits !== undefined) setCredits(d.credits);
          })
          .catch(() => {});
      }

      // Charge credit now if we deferred it (skipCredit) and repo was NOT cached
      if (!data.cached && skipCredit) {
        const ok = await consumeCredit();
        if (!ok) {
          setErrorMsg("No credits remaining. Credits reset every 24 hours.");
          setPageState("error");
          return;
        }
      }

      setProgress(100);
      setStepIdx(INGEST_STEP_COUNT - 1);
      setRepoId(data.repoId);
      const paths: string[] = data.filePaths ?? [];
      await new Promise((r) => setTimeout(r, 600));
      setPageState("ready");

      if (config.mode === "structure") runStructureAnalysis(data.repoId, paths);
      if (config.mode === "security") runSecurityScan(data.repoId);
    } catch (err) {
      clearInterval(timerRef.current!);
      setErrorMsg(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
      setPageState("error");
      if (!skipCredit) {
        fetch("/api/credits")
          .then((r) => r.json())
          .then((d) => setCredits(d.credits ?? 0));
      }
    }
  }

  /* ── Structure analysis ── */
  async function runStructureAnalysis(rid: string, paths: string[]) {
    setStructureLoading(true);
    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: rid, filePaths: paths }),
      });
      setStructureResult(await res.json());
    } catch {
      setStructureResult({
        framework: "unknown",
        findings: [],
        summary: "Could not complete analysis.",
      });
    } finally {
      setStructureLoading(false);
    }
  }

  /* ── Security scan ── */
  async function runSecurityScan(rid: string) {
    setSecurityLoading(true);
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: rid }),
      });
      setSecurityResult(await res.json());
    } catch {
      setSecurityResult({
        findings: [],
        summary: "Could not complete scan.",
        score: 100,
      });
    } finally {
      setSecurityLoading(false);
    }
  }

  /* ── Chat ── */
  async function sendMessage(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg || chatLoading || questionsLeft <= 0) return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    setQuestionsLeft((q) => q - 1);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          repoId,
          toolRole: config.toolRole,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response ?? "No response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  /* ── Render ── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ToolHeader
        config={config}
        credits={credits}
        creditsLoading={creditsLoading}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem 1rem",
          maxWidth: 820,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {pageState === "input" && (
          <InputStep
            config={config}
            repoUrl={repoUrl}
            onRepoUrlChange={setRepoUrl}
            onSubmit={() => setPageState("confirming")}
            onSelectPopular={(url) => {
              setRepoUrl(url);
              // Skip confirm + charge no credit yet (repo is pre-indexed)
              startIngestion(url, /* skipCredit */ true);
            }}
          />
        )}

        {pageState === "confirming" && (
          <ConfirmStep
            repoUrl={repoUrl}
            credits={credits}
            resetAt={resetAt}
            onBack={() => setPageState("input")}
            onConfirm={startIngestion}
          />
        )}

        {pageState === "ingesting" && (
          <IngestingStep
            config={config}
            progress={progress}
            stepIdx={stepIdx}
          />
        )}

        {pageState === "error" && (
          <ErrorStep
            message={errorMsg}
            onRetry={() => {
              setErrorMsg("");
              setPageState("input");
            }}
          />
        )}

        {pageState === "ready" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* Indexed banner */}
            <div
              className="anim-fade-up"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
                background: `${config.color}0d`,
                border: `1px solid ${config.color}1e`,
                borderRadius: "0.875rem",
                padding: "0.65rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.82rem",
                minWidth: 0,
              }}
            >
              <CheckCircle2
                size={15}
                color={config.color}
                style={{ flexShrink: 0 }}
              />
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                Indexed:
              </span>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontWeight: 600,
                  wordBreak: "break-all",
                  minWidth: 0,
                  flex: "1 1 0",
                }}
              >
                {repoId}
              </span>
              {config.mode === "chat" && (
                <span
                  style={{
                    marginLeft: "auto",
                    background:
                      questionsLeft > 2
                        ? `${config.color}1a`
                        : "rgba(244,63,94,0.12)",
                    border: `1px solid ${questionsLeft > 2 ? config.color + "30" : "rgba(244,63,94,0.28)"}`,
                    borderRadius: 9999,
                    padding: "0.22rem 0.65rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: questionsLeft > 2 ? config.color : "#f43f5e",
                  }}
                >
                  {questionsLeft} question{questionsLeft !== 1 ? "s" : ""} left
                </span>
              )}
            </div>

            {config.mode === "structure" && (
              <StructureResults
                loading={structureLoading}
                result={structureResult}
              />
            )}

            {config.mode === "security" && (
              <SecurityResults
                loading={securityLoading}
                result={securityResult}
              />
            )}

            {config.mode === "chat" && (
              <ChatInterface
                config={config}
                messages={messages}
                input={chatInput}
                chatLoading={chatLoading}
                questionsLeft={questionsLeft}
                onInputChange={setChatInput}
                onSend={sendMessage}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
