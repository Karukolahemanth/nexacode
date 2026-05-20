"use client";

import React, { useState } from "react";
import {
  FileText,
  FileOutput,
  Terminal,
  Search,
  Globe,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";

/* ── Types ──────────────────────────────────────── */

export type ToolType = "file_read" | "file_write" | "terminal_exec" | "code_search" | "web_search";

export interface ToolCallData {
  id: string;
  type: ToolType;
  status: "running" | "done" | "error";
  args: Record<string, unknown>;
  result?: string;
  duration?: number;
}

/* ── Tool Configs ───────────────────────────────── */

interface ToolConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  file_read: {
    icon: <FileText size={14} />,
    label: "Read File",
    color: "var(--accent-cyan)",
    bgColor: "rgba(34, 211, 238, 0.06)",
    borderColor: "rgba(34, 211, 238, 0.15)",
  },
  file_write: {
    icon: <FileOutput size={14} />,
    label: "Write File",
    color: "var(--accent-emerald)",
    bgColor: "rgba(52, 211, 153, 0.06)",
    borderColor: "rgba(52, 211, 153, 0.15)",
  },
  terminal_exec: {
    icon: <Terminal size={14} />,
    label: "Terminal",
    color: "var(--accent-amber)",
    bgColor: "rgba(251, 191, 36, 0.06)",
    borderColor: "rgba(251, 191, 36, 0.15)",
  },
  code_search: {
    icon: <Search size={14} />,
    label: "Code Search",
    color: "var(--accent-primary)",
    bgColor: "rgba(99, 102, 241, 0.06)",
    borderColor: "rgba(99, 102, 241, 0.15)",
  },
  web_search: {
    icon: <Globe size={14} />,
    label: "Web Search",
    color: "var(--accent-secondary)",
    bgColor: "rgba(139, 92, 246, 0.06)",
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
};

/* ── Arguments Formatters ───────────────────────── */

function FileReadArgs({ args }: { args: Record<string, unknown> }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <FileText size={11} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />
      <span
        className="text-[11px] truncate"
        style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
      >
        {String(args.path || "")}
      </span>
      {args.startLine != null && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
        >
          L{String(args.startLine)}
          {args.endLine ? `-${String(args.endLine)}` : ""}
        </span>
      )}
    </div>
  );
}

function FileWriteArgs({ args }: { args: Record<string, unknown> }) {
  const preview = String(args.content || "").split("\n").slice(0, 5);
  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-2 mb-1.5">
        <FileOutput size={11} style={{ color: "var(--accent-emerald)" }} />
        <span
          className="text-[11px] truncate"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
        >
          {String(args.path || "")}
        </span>
      </div>
      {preview.length > 0 && (
        <div
          className="rounded-md overflow-hidden text-[11px]"
          style={{
            border: "1px solid rgba(52, 211, 153, 0.15)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {preview.map((line, i) => (
            <div
              key={i}
              className="flex items-center px-2 py-0.5"
              style={{
                background: "rgba(34, 197, 94, 0.05)",
                borderBottom: i < preview.length - 1 ? "1px solid rgba(52, 211, 153, 0.08)" : "none",
              }}
            >
              <Plus size={9} style={{ color: "#4ade80", marginRight: "6px", flexShrink: 0 }} />
              <span style={{ color: "#4ade80" }}>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TerminalArgs({ args }: { args: Record<string, unknown> }) {
  return (
    <div className="mt-1.5">
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <span
          className="text-[10px]"
          style={{ color: "var(--accent-amber)" }}
        >
          $
        </span>
        <span
          className="text-[11px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-primary)",
          }}
        >
          {String(args.command || "")}
        </span>
      </div>
    </div>
  );
}

function CodeSearchArgs({ args }: { args: Record<string, unknown> }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Search size={11} style={{ color: "var(--accent-primary)" }} />
      <span
        className="text-[11px] px-2 py-0.5 rounded-md"
        style={{
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {String(args.query || "")}
      </span>
      {args.resultCount != null && (
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {String(args.resultCount)} results
        </span>
      )}
    </div>
  );
}

function WebSearchArgs({ args }: { args: Record<string, unknown> }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Globe size={11} style={{ color: "var(--accent-secondary)" }} />
      <span
        className="text-[11px]"
        style={{ color: "var(--text-secondary)" }}
      >
        &quot;{String(args.query || "")}&quot;
      </span>
    </div>
  );
}

function ArgsRenderer({ type, args }: { type: ToolType; args: Record<string, unknown> }) {
  switch (type) {
    case "file_read":
      return <FileReadArgs args={args} />;
    case "file_write":
      return <FileWriteArgs args={args} />;
    case "terminal_exec":
      return <TerminalArgs args={args} />;
    case "code_search":
      return <CodeSearchArgs args={args} />;
    case "web_search":
      return <WebSearchArgs args={args} />;
    default:
      return null;
  }
}

/* ── Main ToolCallCard ──────────────────────────── */

export default function ToolCallCard({ tool }: { tool: ToolCallData }) {
  const [expanded, setExpanded] = useState(false);
  const config = TOOL_CONFIGS[tool.type];
  const isRunning = tool.status === "running";
  const isError = tool.status === "error";

  return (
    <div
      className="tool-call-card my-2 overflow-hidden transition-all"
      style={{
        borderRadius: "10px",
        border: `1px solid ${isError ? "rgba(251, 113, 133, 0.2)" : config.borderColor}`,
        background: config.bgColor,
        animation: "toolCardIn 0.25s ease-out",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isError
          ? "rgba(251, 113, 133, 0.35)"
          : config.color.replace(")", ", 0.35)").replace("var(", "rgba(").replace("--accent-cyan", "34, 211, 238").replace("--accent-emerald", "52, 211, 153").replace("--accent-amber", "251, 191, 36").replace("--accent-primary", "99, 102, 241").replace("--accent-secondary", "139, 92, 246");
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isError
          ? "rgba(251, 113, 133, 0.2)"
          : config.borderColor;
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        {/* Tool icon */}
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{
            background: `${config.bgColor}`,
            border: `1px solid ${config.borderColor}`,
            color: config.color,
          }}
        >
          {isRunning ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            config.icon
          )}
        </div>

        {/* Tool name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: config.color }}>
              {config.label}
            </span>
            {tool.duration != null && (
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {tool.duration < 1000 ? `${tool.duration}ms` : `${(tool.duration / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isRunning && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "var(--accent-primary)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              Running
            </span>
          )}
          {tool.status === "done" && (
            <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
          )}
          {isError && (
            <XCircle size={14} style={{ color: "var(--accent-rose)" }} />
          )}
        </div>
      </div>

      {/* Arguments preview */}
      <div className="px-3 pb-2">
        <ArgsRenderer type={tool.type} args={tool.args} />
      </div>

      {/* Result (collapsible) */}
      {tool.result && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium transition-colors"
            style={{
              color: "var(--text-tertiary)",
              borderTop: `1px solid ${config.borderColor}`,
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            {expanded ? "Hide" : "Show"} result
          </button>

          {expanded && (
            <div
              className="px-3 pb-2.5"
              style={{ animation: "slideDown 0.15s ease-out" }}
            >
              <pre
                className="text-[11px] leading-relaxed p-2.5 rounded-md overflow-x-auto whitespace-pre-wrap"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-primary)",
                  color: tool.type === "terminal_exec" ? "var(--accent-emerald)" : "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {tool.result}
              </pre>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes toolCardIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* ── Demo Export ─────────────────────────────────── */

export const DEMO_TOOL_CALLS: ToolCallData[] = [
  {
    id: "tc-1",
    type: "file_read",
    status: "done",
    args: { path: "src/hooks/useAuth.ts", startLine: 1, endLine: 42 },
    result: 'import { useState, useEffect } from "react";\nimport { AuthService } from "../services/auth";\n\nexport function useAuth() {\n  const [user, setUser] = useState(null);\n  // ... 37 more lines',
    duration: 120,
  },
  {
    id: "tc-2",
    type: "code_search",
    status: "done",
    args: { query: "AuthProvider", resultCount: 4 },
    result: "src/providers/AuthProvider.tsx:1 — export function AuthProvider\nsrc/app/layout.tsx:8 — <AuthProvider>\nsrc/hooks/useAuth.ts:3 — import { AuthContext }\nsrc/types/auth.ts:12 — interface AuthProviderProps",
    duration: 340,
  },
  {
    id: "tc-3",
    type: "file_write",
    status: "done",
    args: {
      path: "src/contexts/AuthContext.tsx",
      content: 'import { createContext, useContext } from "react";\nimport type { User } from "../types";\n\nexport interface AuthState {\n  user: User | null;\n  loading: boolean;\n  isAuthenticated: boolean;\n}',
    },
    result: "File created successfully — 28 lines written",
    duration: 85,
  },
  {
    id: "tc-4",
    type: "terminal_exec",
    status: "done",
    args: { command: "npx tsc --noEmit" },
    result: "✓ No type errors found.\n\nChecked 142 files in 3.2s.",
    duration: 3200,
  },
  {
    id: "tc-5",
    type: "web_search",
    status: "running",
    args: { query: "React 19 createContext best practices" },
  },
];
