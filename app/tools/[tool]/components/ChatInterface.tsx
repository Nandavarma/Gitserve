"use client";

import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { MessageContent } from "./MessageContent";
import type { Message, ToolConfig } from "./types";

interface Props {
  config: ToolConfig;
  messages: Message[];
  input: string;
  chatLoading: boolean;
  questionsLeft: number;
  onInputChange: (v: string) => void;
  onSend: (text?: string) => void;
}

export function ChatInterface({
  config,
  messages,
  input,
  chatLoading,
  questionsLeft,
  onInputChange,
  onSend,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <>
      {/* Suggested questions (shown until first message) */}
      {messages.length === 0 && config.suggestedQuestions.length > 0 && (
        <div className="anim-fade-up delay-100" style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.65rem", fontWeight: 500 }}>
            Try asking:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {config.suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSend(q)}
                disabled={questionsLeft <= 0}
                style={{
                  background: "rgba(139,92,246,0.07)",
                  border: "1px solid rgba(139,92,246,0.17)",
                  borderRadius: 9999,
                  padding: "0.38rem 0.85rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  cursor: questionsLeft > 0 ? "pointer" : "not-allowed",
                  opacity: questionsLeft > 0 ? 1 : 0.4,
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (questionsLeft > 0) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.14)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.33)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.07)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.17)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message thread */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          paddingBottom: "1rem",
          minHeight: 200,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-start",
              gap: "0.55rem",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: `${config.color}18`,
                  border: `1px solid ${config.color}2a`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                }}
              >
                <config.Icon size={15} color={config.color} strokeWidth={1.75} />
              </div>
            )}
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
              {msg.role === "user" ? (
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
              ) : (
                <MessageContent content={msg.content} />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {chatLoading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                background: `${config.color}18`,
                border: `1px solid ${config.color}2a`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <config.Icon size={15} color={config.color} strokeWidth={1.75} />
            </div>
            <div className="chat-bubble-ai">
              <div style={{ display: "flex", gap: 5, padding: "3px 0", alignItems: "center" }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          background: "rgba(12,0,15,0.82)",
          border: "1px solid var(--border-base)",
          borderRadius: "1.25rem",
          padding: "0.75rem",
          marginTop: "0.75rem",
        }}
      >
        {questionsLeft <= 0 ? (
          <p style={{ textAlign: "center", padding: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Session limit reached (5 questions). Analyse a new repository to continue.
          </p>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question about this codebase…"
              disabled={chatLoading}
              rows={2}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.6,
                paddingLeft: "0.5rem",
              }}
            />
            <button
              onClick={() => onSend()}
              disabled={!input.trim() || chatLoading}
              style={{
                width: 42,
                height: 42,
                borderRadius: "0.75rem",
                flexShrink: 0,
                border: "none",
                background: input.trim() && !chatLoading ? "var(--gradient-cta)" : "rgba(139,92,246,0.1)",
                cursor: input.trim() && !chatLoading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <ArrowUp
                size={18}
                strokeWidth={2.5}
                color={input.trim() && !chatLoading ? "white" : "var(--text-muted)"}
              />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
