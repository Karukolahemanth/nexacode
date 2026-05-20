"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Bot, User, Copy, Check, FileCode, ExternalLink, Clock } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ── Code Block with Actions ─────────────────── */
function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="chat-code-block group my-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-primary)" }}>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {language || "code"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all hover:bg-white/5"
            style={{ color: copied ? "var(--accent-emerald)" : "var(--text-tertiary)" }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {/* Code */}
      <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ── RAG Sources ─────────────────────────────── */
function RAGSources({ sources }: { sources: NonNullable<ChatMessageType["ragSources"]> }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((s, i) => (
        <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]" style={{ background: "var(--accent-glow)", color: "var(--accent-primary-hover)", border: "1px solid var(--border-accent)" }}>
          <FileCode size={10} />
          <span className="truncate max-w-[120px]">{s.file.split("/").pop()}</span>
          {s.startLine > 0 && <span style={{ color: "var(--text-muted)" }}>L{s.startLine}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Streaming Cursor ────────────────────────── */
function StreamingCursor() {
  return (
    <span
      className="inline-block w-[2px] h-[14px] ml-0.5 align-middle rounded-full"
      style={{ background: "var(--accent-primary)", animation: "blink 1s step-end infinite" }}
    />
  );
}

/* ── Timestamp ───────────────────────────────── */
function Timestamp({ ts }: { ts: number }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const d = new Date(ts);
    setText(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [ts]);

  if (!text) return null;

  return (
    <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
      <Clock size={9} />
      {text}
    </span>
  );
}

/* ── Main Message Bubble ─────────────────────── */
export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const [copied, setCopied] = useState(false);
  const showTimestamps = useSettingsStore((s) => s.showTimestamps);
  const isUser = message.role === "user";

  const handleCopyAll = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group chat-message px-4 py-3"
      style={{
        background: isUser ? "transparent" : "rgba(15, 20, 35, 0.5)",
        animation: "chatMessageIn 0.25s ease-out",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 mt-0.5"
          style={{
            background: isUser
              ? "var(--accent-glow)"
              : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            boxShadow: isUser ? "none" : "0 2px 8px rgba(99, 102, 241, 0.2)",
          }}
        >
          {isUser ? (
            <User size={13} style={{ color: "var(--accent-primary)" }} />
          ) : (
            <Bot size={13} className="text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: isUser ? "var(--text-secondary)" : "var(--accent-primary-hover)" }}
              >
                {isUser ? "You" : "NexusAI"}
              </span>
              {message.model && !isUser && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                  {message.model}
                </span>
              )}
              {showTimestamps && <Timestamp ts={message.timestamp} />}
            </div>
            <button
              onClick={handleCopyAll}
              className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:bg-white/5"
              style={{ color: "var(--text-tertiary)" }}
              title="Copy message"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>

          {/* Message body */}
          <div className="text-[13px] leading-relaxed chat-message-content" style={{ color: "var(--text-primary)" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");
                  const isInline = !className;

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          background: "var(--bg-surface)",
                          color: "var(--accent-cyan)",
                          fontFamily: "var(--font-mono)",
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 ml-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 ml-1">{children}</ol>,
                li: ({ children }) => <li className="text-[13px]">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>{children}</strong>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline decoration-dotted underline-offset-2" style={{ color: "var(--accent-primary-hover)" }}>
                    {children}<ExternalLink size={10} />
                  </a>
                ),
                h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1" style={{ color: "var(--text-primary)" }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1" style={{ color: "var(--text-primary)" }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 pl-3 my-2 italic" style={{ borderColor: "var(--accent-primary)", color: "var(--text-secondary)" }}>{children}</blockquote>
                ),
                hr: () => <hr className="my-3" style={{ borderColor: "var(--border-primary)" }} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && <StreamingCursor />}
          </div>

          {/* RAG Sources */}
          {message.ragSources && message.ragSources.length > 0 && (
            <RAGSources sources={message.ragSources} />
          )}
        </div>
      </div>
    </div>
  );
}
