"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Check,
  X,
  FileCode,
  Plus,
  Minus,
  Columns,
  Rows,
  ChevronDown,
} from "lucide-react";

/* ── Types ──────────────────────────────────────── */

export interface DiffLine {
  type: "added" | "removed" | "unchanged" | "header";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export interface DiffData {
  filePath: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

/* ── Demo Data ──────────────────────────────────── */

const DEMO_DIFF: DiffData = {
  filePath: "src/hooks/useAuth.ts",
  additions: 14,
  deletions: 8,
  lines: [
    { type: "unchanged", content: 'import { useState, useEffect } from "react";', oldLineNum: 1, newLineNum: 1 },
    { type: "removed",   content: 'import { AuthService } from "../services/auth";', oldLineNum: 2 },
    { type: "removed",   content: 'import type { User } from "../types";', oldLineNum: 3 },
    { type: "added",     content: 'import { useContext } from "react";', newLineNum: 2 },
    { type: "added",     content: 'import { AuthContext } from "../contexts/AuthContext";', newLineNum: 3 },
    { type: "added",     content: 'import type { AuthState } from "../contexts/AuthContext";', newLineNum: 4 },
    { type: "unchanged", content: "", oldLineNum: 4, newLineNum: 5 },
    { type: "removed",   content: "export function useAuth() {", oldLineNum: 5 },
    { type: "removed",   content: "  const [user, setUser] = useState<User | null>(null);", oldLineNum: 6 },
    { type: "removed",   content: "  const [loading, setLoading] = useState(true);", oldLineNum: 7 },
    { type: "added",     content: "export function useAuth(): AuthState {", newLineNum: 6 },
    { type: "added",     content: "  const context = useContext(AuthContext);", newLineNum: 7 },
    { type: "unchanged", content: "", oldLineNum: 8, newLineNum: 8 },
    { type: "removed",   content: "  useEffect(() => {", oldLineNum: 9 },
    { type: "removed",   content: "    AuthService.getCurrentUser()", oldLineNum: 10 },
    { type: "removed",   content: "      .then(setUser)", oldLineNum: 11 },
    { type: "removed",   content: "      .finally(() => setLoading(false));", oldLineNum: 12 },
    { type: "removed",   content: "  }, []);", oldLineNum: 13 },
    { type: "added",     content: "  if (!context) {", newLineNum: 9 },
    { type: "added",     content: '    throw new Error("useAuth must be used within AuthProvider");', newLineNum: 10 },
    { type: "added",     content: "  }", newLineNum: 11 },
    { type: "unchanged", content: "", oldLineNum: 14, newLineNum: 12 },
    { type: "removed",   content: "  return { user, loading, isAuthenticated: !!user };", oldLineNum: 15 },
    { type: "added",     content: "  return context;", newLineNum: 13 },
    { type: "unchanged", content: "}", oldLineNum: 16, newLineNum: 14 },
  ],
};

/* ── Diff Line Component ────────────────────────── */
function DiffLineRow({
  line,
  showSideBySide,
}: {
  line: DiffLine;
  showSideBySide?: boolean;
}) {
  const bgColors: Record<DiffLine["type"], string> = {
    added: "rgba(34, 197, 94, 0.08)",
    removed: "rgba(239, 68, 68, 0.08)",
    unchanged: "transparent",
    header: "rgba(99, 102, 241, 0.06)",
  };

  const borderColors: Record<DiffLine["type"], string> = {
    added: "rgba(34, 197, 94, 0.3)",
    removed: "rgba(239, 68, 68, 0.3)",
    unchanged: "transparent",
    header: "rgba(99, 102, 241, 0.2)",
  };

  const textColors: Record<DiffLine["type"], string> = {
    added: "#4ade80",
    removed: "#f87171",
    unchanged: "var(--text-secondary)",
    header: "var(--accent-primary)",
  };

  const prefixSymbol: Record<DiffLine["type"], string> = {
    added: "+",
    removed: "-",
    unchanged: " ",
    header: "@",
  };

  return (
    <div
      className="flex items-stretch font-mono text-[12px] leading-[20px]"
      style={{
        background: bgColors[line.type],
        borderLeft: `2px solid ${borderColors[line.type]}`,
      }}
    >
      {/* Line numbers */}
      <div
        className="flex shrink-0 select-none"
        style={{
          width: "72px",
          minWidth: "72px",
          color: "var(--text-muted)",
          borderRight: "1px solid var(--border-primary)",
        }}
      >
        <span
          className="w-9 text-right px-2"
          style={{
            color:
              line.type === "removed" ? "rgba(248, 113, 113, 0.5)" : "var(--text-muted)",
          }}
        >
          {line.oldLineNum ?? ""}
        </span>
        <span
          className="w-9 text-right px-2"
          style={{
            color:
              line.type === "added" ? "rgba(74, 222, 128, 0.5)" : "var(--text-muted)",
          }}
        >
          {line.newLineNum ?? ""}
        </span>
      </div>

      {/* Prefix */}
      <span
        className="w-5 text-center shrink-0 select-none font-bold"
        style={{ color: textColors[line.type] }}
      >
        {prefixSymbol[line.type]}
      </span>

      {/* Content */}
      <span
        className="flex-1 px-1 whitespace-pre"
        style={{
          color: textColors[line.type],
          fontFamily: "var(--font-mono)",
        }}
      >
        {line.content}
      </span>
    </div>
  );
}

/* ── Main DiffPreview Component ─────────────────── */
export default function DiffPreview({
  diff = DEMO_DIFF,
  onAccept,
  onReject,
}: {
  diff?: DiffData;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAccept = useCallback(() => {
    setStatus("accepted");
    onAccept?.();
  }, [onAccept]);

  const handleReject = useCallback(() => {
    setStatus("rejected");
    onReject?.();
  }, [onReject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (status !== "pending") return;
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleAccept();
      }
      if (e.ctrlKey && e.key === "Backspace") {
        e.preventDefault();
        handleReject();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, handleAccept, handleReject]);

  const isResolved = status !== "pending";

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "12px",
        border: `1px solid ${
          status === "accepted"
            ? "rgba(34, 197, 94, 0.3)"
            : status === "rejected"
            ? "rgba(239, 68, 68, 0.2)"
            : "var(--border-secondary)"
        }`,
        background: "var(--bg-primary)",
        transition: "all 0.3s ease",
        opacity: status === "rejected" ? 0.6 : 1,
      }}
    >
      {/* File header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          borderBottom: isCollapsed ? "none" : "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
        }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 flex-1 min-w-0"
          style={{ background: "transparent" }}
        >
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-muted)",
              transform: isCollapsed ? "rotate(-90deg)" : "none",
              transition: "transform 0.15s ease",
            }}
          />
          <FileCode size={14} style={{ color: "var(--accent-primary)" }} />
          <span
            className="text-xs font-medium truncate"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
          >
            {diff.filePath}
          </span>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "#4ade80" }}>
              <Plus size={10} />
              {diff.additions}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "#f87171" }}>
              <Minus size={10} />
              {diff.deletions}
            </span>
          </div>
        </button>

        {/* Accept / Reject buttons */}
        {!isResolved && (
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <button
              onClick={handleReject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                color: "var(--accent-rose)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              }}
              title="Reject (Ctrl+Backspace)"
            >
              <X size={12} />
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
              style={{
                background: "rgba(34, 197, 94, 0.12)",
                color: "#4ade80",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(34, 197, 94, 0.12)";
              }}
              title="Accept (Ctrl+Enter)"
            >
              <Check size={12} />
              Accept
            </button>
          </div>
        )}

        {/* Resolution badge */}
        {isResolved && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold"
            style={{
              background:
                status === "accepted" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.08)",
              color: status === "accepted" ? "#4ade80" : "var(--accent-rose)",
            }}
          >
            {status === "accepted" ? (
              <>
                <Check size={12} /> Accepted
              </>
            ) : (
              <>
                <X size={12} /> Rejected
              </>
            )}
          </div>
        )}
      </div>

      {/* Diff lines */}
      {!isCollapsed && (
        <div
          className="overflow-x-auto overflow-y-auto"
          style={{
            maxHeight: "400px",
            background: "var(--bg-primary)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {diff.lines.map((line, idx) => (
            <DiffLineRow key={idx} line={line} />
          ))}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!isResolved && !isCollapsed && (
        <div
          className="flex items-center justify-center gap-4 py-2"
          style={{
            borderTop: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
          }}
        >
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            <kbd
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-tertiary)",
              }}
            >
              Ctrl+Enter
            </kbd>{" "}
            Accept
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            <kbd
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-secondary)",
                color: "var(--text-tertiary)",
              }}
            >
              Ctrl+Backspace
            </kbd>{" "}
            Reject
          </span>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
