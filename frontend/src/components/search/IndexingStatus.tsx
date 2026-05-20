"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ── Types ─────────────────────────────────────── */
type IndexStatus = "indexed" | "indexing" | "not_indexed";

interface FileTypeBreakdown {
  ext: string;
  count: number;
  color: string;
}

/* ── Demo Data ─────────────────────────────────── */
const DEMO_FILE_TYPES: FileTypeBreakdown[] = [
  { ext: ".tsx", count: 23, color: "var(--accent-cyan)" },
  { ext: ".ts", count: 12, color: "var(--accent-primary)" },
  { ext: ".css", count: 5, color: "var(--accent-secondary)" },
  { ext: ".json", count: 4, color: "var(--accent-amber)" },
  { ext: ".md", count: 3, color: "var(--accent-emerald)" },
];

const DEMO_TOTAL = DEMO_FILE_TYPES.reduce((s, f) => s + f.count, 0); // 47

/* ── Main Component ────────────────────────────── */
export default function IndexingStatus() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<IndexStatus>("indexed");
  const [indexedCount, setIndexedCount] = useState(DEMO_TOTAL);
  const [totalCount] = useState(DEMO_TOTAL);
  const [isReindexing, setIsReindexing] = useState(false);
  const [lastIndexed] = useState(new Date(Date.now() - 12 * 60 * 1000)); // 12 min ago

  // Simulate re-indexing
  const handleReindex = () => {
    if (isReindexing) return;
    setIsReindexing(true);
    setStatus("indexing");
    setIndexedCount(0);

    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 4) + 1;
      if (count >= DEMO_TOTAL) {
        count = DEMO_TOTAL;
        clearInterval(interval);
        setStatus("indexed");
        setIsReindexing(false);
      }
      setIndexedCount(Math.min(count, DEMO_TOTAL));
    }, 120);
  };

  const progressPct = totalCount > 0 ? (indexedCount / totalCount) * 100 : 0;

  const statusConfig = {
    indexed: {
      label: "Indexed",
      icon: CheckCircle2,
      color: "var(--accent-emerald)",
      bg: "rgba(52, 211, 153, 0.1)",
    },
    indexing: {
      label: "Indexing...",
      icon: Loader2,
      color: "var(--accent-amber)",
      bg: "rgba(251, 191, 36, 0.1)",
    },
    not_indexed: {
      label: "Not indexed",
      icon: Database,
      color: "var(--text-muted)",
      bg: "rgba(71, 85, 105, 0.1)",
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  const timeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      className="shrink-0"
      style={{
        borderTop: "1px solid var(--border-primary)",
        background: "var(--bg-primary)",
      }}
    >
      {/* Collapsed / Header Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-5 h-5 rounded"
            style={{ background: cfg.bg }}
          >
            <StatusIcon
              size={11}
              style={{
                color: cfg.color,
                ...(status === "indexing"
                  ? { animation: "spin 1s linear infinite" }
                  : {}),
              }}
            />
          </div>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
            RAG Index
          </span>
          <span
            className="text-[9px] px-1.5 py-px rounded-full font-medium"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
            {indexedCount}/{totalCount}
          </span>
          {isExpanded ? (
            <ChevronDown size={11} style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronUp size={11} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-3 pb-1">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "var(--bg-surface)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background:
                status === "indexing"
                  ? "linear-gradient(90deg, var(--accent-amber), var(--accent-primary))"
                  : "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
              transition: "width 0.3s ease-out",
              ...(status === "indexing"
                ? { animation: "pulse-glow 1.5s infinite" }
                : {}),
            }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className="px-3 pb-2.5 animate-fade-in"
          style={{
            borderTop: "1px solid var(--border-primary)",
          }}
        >
          {/* File type breakdown */}
          <div className="mt-2">
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              File Types
            </span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {DEMO_FILE_TYPES.map((ft) => (
                <div
                  key={ft.ext}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{
                    background: `${ft.color}10`,
                    color: ft.color,
                    border: `1px solid ${ft.color}20`,
                  }}
                >
                  <span>{ft.count}</span>
                  <span style={{ opacity: 0.7 }}>{ft.ext}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              Last indexed: {timeAgo(lastIndexed)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReindex();
              }}
              disabled={isReindexing}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                background: isReindexing ? "var(--bg-surface)" : "var(--accent-glow)",
                color: isReindexing ? "var(--text-muted)" : "var(--accent-primary)",
                border: `1px solid ${isReindexing ? "var(--border-primary)" : "var(--border-accent)"}`,
                cursor: isReindexing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw
                size={10}
                style={isReindexing ? { animation: "spin 1s linear infinite" } : {}}
              />
              {isReindexing ? "Indexing..." : "Re-index"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
