"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  CaseSensitive,
  Regex,
  FileCode,
  ChevronRight,
  X,
  Folder,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import IndexingStatus from "./IndexingStatus";

/* ── Types ─────────────────────────────────────── */
type SearchMode = "text" | "semantic";

interface SearchResult {
  id: string;
  filePath: string;
  fileName: string;
  lineNumber: number;
  lineContent: string;
  matchRange?: [number, number]; // start, end char index
  relevanceScore?: number; // 0-1 for semantic
  language: string;
}

/* ── Demo Data ─────────────────────────────────── */
const DEMO_TEXT_RESULTS: SearchResult[] = [
  {
    id: "r1",
    filePath: "src/components/editor/CodeEditor.tsx",
    fileName: "CodeEditor.tsx",
    lineNumber: 42,
    lineContent: "const handleEditorChange = (value: string) => {",
    matchRange: [6, 24],
    language: "typescript",
  },
  {
    id: "r2",
    filePath: "src/stores/editorStore.ts",
    fileName: "editorStore.ts",
    lineNumber: 80,
    lineContent: "  updateContent: (id: string, content: string) => void;",
    matchRange: [2, 15],
    language: "typescript",
  },
  {
    id: "r3",
    filePath: "src/components/chat/ChatInput.tsx",
    fileName: "ChatInput.tsx",
    lineNumber: 15,
    lineContent: "const [inputValue, setInputValue] = useState('');",
    matchRange: [7, 17],
    language: "typescript",
  },
  {
    id: "r4",
    filePath: "src/hooks/useWebSocket.ts",
    fileName: "useWebSocket.ts",
    lineNumber: 33,
    lineContent: "  socket.onmessage = (event: MessageEvent) => {",
    matchRange: [2, 8],
    language: "typescript",
  },
  {
    id: "r5",
    filePath: "src/app/layout.tsx",
    fileName: "layout.tsx",
    lineNumber: 8,
    lineContent: "export default function RootLayout({ children }: Props) {",
    matchRange: [24, 34],
    language: "typescript",
  },
  {
    id: "r6",
    filePath: "src/lib/utils.ts",
    fileName: "utils.ts",
    lineNumber: 4,
    lineContent: "export function cn(...inputs: ClassValue[]) {",
    matchRange: [16, 18],
    language: "typescript",
  },
];

const DEMO_SEMANTIC_RESULTS: SearchResult[] = [
  {
    id: "s1",
    filePath: "src/stores/chatStore.ts",
    fileName: "chatStore.ts",
    lineNumber: 105,
    lineContent: "  addMessage: (msg) => { ... }",
    relevanceScore: 0.96,
    language: "typescript",
  },
  {
    id: "s2",
    filePath: "src/components/chat/ChatMessage.tsx",
    fileName: "ChatMessage.tsx",
    lineNumber: 87,
    lineContent: "export default function ChatMessage({ message }) {",
    relevanceScore: 0.91,
    language: "typescript",
  },
  {
    id: "s3",
    filePath: "src/hooks/useWebSocket.ts",
    fileName: "useWebSocket.ts",
    lineNumber: 22,
    lineContent: "  const sendMessage = useCallback((data) => { ... }",
    relevanceScore: 0.87,
    language: "typescript",
  },
  {
    id: "s4",
    filePath: "src/components/chat/ChatInput.tsx",
    fileName: "ChatInput.tsx",
    lineNumber: 45,
    lineContent: "  const handleSubmit = async () => {",
    relevanceScore: 0.82,
    language: "typescript",
  },
  {
    id: "s5",
    filePath: "src/stores/editorStore.ts",
    fileName: "editorStore.ts",
    lineNumber: 36,
    lineContent: "  openFile: (file) => { const id = generateTabId(...) }",
    relevanceScore: 0.74,
    language: "typescript",
  },
  {
    id: "s6",
    filePath: "src/components/layout/IDELayout.tsx",
    fileName: "IDELayout.tsx",
    lineNumber: 127,
    lineContent: "export default function IDELayout() {",
    relevanceScore: 0.68,
    language: "typescript",
  },
  {
    id: "s7",
    filePath: "src/app/globals.css",
    fileName: "globals.css",
    lineNumber: 7,
    lineContent: ":root { --bg-primary: #0a0e1a; ... }",
    relevanceScore: 0.52,
    language: "css",
  },
];

/* ── Shimmer Loader ────────────────────────────── */
function ShimmerLine({ width }: { width: string }) {
  return (
    <div
      className="rounded"
      style={{
        width,
        height: "12px",
        background:
          "linear-gradient(90deg, var(--bg-tertiary) 0%, var(--bg-surface) 50%, var(--bg-tertiary) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

function ShimmerResult() {
  return (
    <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-primary)" }}>
      <div className="flex items-center gap-2 mb-2">
        <ShimmerLine width="14px" />
        <ShimmerLine width="45%" />
      </div>
      <div className="ml-5">
        <ShimmerLine width="80%" />
      </div>
      <div className="ml-5 mt-1.5">
        <ShimmerLine width="60%" />
      </div>
    </div>
  );
}

/* ── Relevance Badge ───────────────────────────── */
function RelevanceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  let color = "var(--accent-emerald)";
  if (pct < 60) color = "var(--accent-amber)";
  else if (pct < 80) color = "var(--accent-cyan)";

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: "4px",
          height: "4px",
          background: color,
          boxShadow: `0 0 4px ${color}`,
        }}
      />
      {pct}%
    </div>
  );
}

/* ── Highlighted Line Content ──────────────────── */
function HighlightedContent({
  content,
  matchRange,
}: {
  content: string;
  matchRange?: [number, number];
}) {
  if (!matchRange) {
    return (
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
        {content}
      </span>
    );
  }

  const [start, end] = matchRange;
  return (
    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
      {content.slice(0, start)}
      <span
        style={{
          background: "rgba(251, 191, 36, 0.2)",
          color: "var(--accent-amber)",
          borderRadius: "2px",
          padding: "0 1px",
        }}
      >
        {content.slice(start, end)}
      </span>
      {content.slice(end)}
    </span>
  );
}

/* ── Single Result Item ────────────────────────── */
function ResultItem({
  result,
  mode,
  onClick,
}: {
  result: SearchResult;
  mode: SearchMode;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left px-3 py-2 transition-all"
      style={{
        background: hovered ? "var(--bg-hover)" : "transparent",
        borderBottom: "1px solid var(--border-primary)",
        cursor: "pointer",
        animation: "slideInUp 0.2s ease-out",
      }}
    >
      {/* File header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCode
            size={12}
            style={{ color: "var(--accent-primary)", flexShrink: 0 }}
          />
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {result.fileName}
          </span>
          <span
            className="text-[10px] truncate"
            style={{ color: "var(--text-muted)" }}
          >
            :{result.lineNumber}
          </span>
        </div>
        {mode === "semantic" && result.relevanceScore !== undefined && (
          <RelevanceBadge score={result.relevanceScore} />
        )}
      </div>

      {/* File path */}
      <div
        className="flex items-center gap-1 mt-0.5 ml-5"
        style={{ color: "var(--text-muted)" }}
      >
        <Folder size={9} />
        <span className="text-[9px] truncate">{result.filePath}</span>
      </div>

      {/* Code preview */}
      <div
        className="mt-1 ml-5 text-[11px] leading-relaxed rounded px-2 py-1 overflow-hidden"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-primary)",
          maxHeight: "40px",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] shrink-0 select-none"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {result.lineNumber}
          </span>
          <div className="truncate text-[11px]">
            <HighlightedContent content={result.lineContent} matchRange={result.matchRange} />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Main SearchPanel ──────────────────────────── */
export default function SearchPanel() {
  const [mode, setMode] = useState<SearchMode>("text");
  const [query, setQuery] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { openFile } = useEditorStore();

  // Simulate search with delay
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      // Simulate network delay
      setTimeout(() => {
        const demoResults =
          mode === "text" ? DEMO_TEXT_RESULTS : DEMO_SEMANTIC_RESULTS;
        // Filter demo results by query (simple demo filter)
        const filtered = demoResults.filter(
          (r) =>
            r.lineContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            searchQuery.length > 2 // Show all for longer queries (demo)
        );
        setResults(filtered);
        setIsLoading(false);
      }, 600 + Math.random() * 400);
    },
    [mode]
  );

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const timer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    openFile({
      path: result.filePath,
      name: result.fileName,
      language: result.language,
      content: `// Content of ${result.fileName}\n// Opened from search result at line ${result.lineNumber}\n\n${result.lineContent}`,
    });
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  // Group results by file
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.filePath]) acc[r.filePath] = [];
    acc[r.filePath].push(r);
    return acc;
  }, {});

  const totalFiles = Object.keys(groupedResults).length;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: "36px",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          Search
        </span>
        {hasSearched && !isLoading && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: "var(--accent-glow)",
              color: "var(--accent-primary-hover)",
            }}
          >
            {results.length} result{results.length !== 1 ? "s" : ""} in {totalFiles} file{totalFiles !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="px-3 pt-2.5 pb-1 shrink-0">
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}
        >
          <button
            onClick={() => { setMode("text"); setResults([]); setHasSearched(false); }}
            className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: mode === "text" ? "var(--bg-surface)" : "transparent",
              color: mode === "text" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: mode === "text" ? "var(--shadow-sm)" : "none",
            }}
          >
            <Search size={12} />
            Text
          </button>
          <button
            onClick={() => { setMode("semantic"); setResults([]); setHasSearched(false); }}
            className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: mode === "semantic" ? "var(--bg-surface)" : "transparent",
              color: mode === "semantic" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: mode === "semantic" ? "var(--shadow-sm)" : "none",
            }}
          >
            <Sparkles size={12} />
            Semantic
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 shrink-0">
        <div
          className="flex items-center rounded-lg overflow-hidden transition-all"
          style={{
            background: "var(--bg-tertiary)",
            border: `1px solid ${query ? "var(--border-accent)" : "var(--border-primary)"}`,
            boxShadow: query ? "0 0 8px rgba(99, 102, 241, 0.08)" : "none",
          }}
        >
          <div className="pl-2.5 flex items-center">
            {mode === "text" ? (
              <Search size={13} style={{ color: "var(--text-muted)" }} />
            ) : (
              <Sparkles size={13} style={{ color: "var(--accent-secondary)" }} />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "text"
                ? "Search in files..."
                : "Describe what you're looking for..."
            }
            className="flex-1 px-2 py-1.5 text-[12px] outline-none bg-transparent"
            style={{
              color: "var(--text-primary)",
              fontFamily: mode === "text" ? "var(--font-mono)" : "var(--font-sans)",
            }}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="p-1.5 mr-0.5 rounded hover:bg-white/5 transition-colors"
            >
              <X size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        {/* Toggles (text mode only) */}
        {mode === "text" && (
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={() => setIsCaseSensitive(!isCaseSensitive)}
              className="flex items-center justify-center w-6 h-6 rounded transition-all"
              title="Match Case"
              style={{
                background: isCaseSensitive ? "var(--accent-glow-strong)" : "transparent",
                color: isCaseSensitive ? "var(--accent-primary)" : "var(--text-muted)",
                border: `1px solid ${isCaseSensitive ? "var(--border-accent)" : "var(--border-primary)"}`,
              }}
            >
              <CaseSensitive size={14} />
            </button>
            <button
              onClick={() => setIsRegex(!isRegex)}
              className="flex items-center justify-center w-6 h-6 rounded transition-all"
              title="Use Regular Expression"
              style={{
                background: isRegex ? "var(--accent-glow-strong)" : "transparent",
                color: isRegex ? "var(--accent-primary)" : "var(--text-muted)",
                border: `1px solid ${isRegex ? "var(--border-accent)" : "var(--border-primary)"}`,
              }}
            >
              <Regex size={14} />
            </button>
            <span className="text-[9px] ml-auto" style={{ color: "var(--text-muted)" }}>
              {isCaseSensitive && "Aa"} {isRegex && ".*"}
            </span>
          </div>
        )}

        {/* Semantic hint */}
        {mode === "semantic" && (
          <p className="text-[9px] mt-1.5" style={{ color: "var(--text-muted)" }}>
            🧠 AI-powered search across your codebase using embeddings
          </p>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Loading State */}
        {isLoading && (
          <div className="animate-fade-in">
            <ShimmerResult />
            <ShimmerResult />
            <ShimmerResult />
            <ShimmerResult />
          </div>
        )}

        {/* Results List */}
        {!isLoading && results.length > 0 && (
          <div className="animate-fade-in">
            {results.map((result) => (
              <ResultItem
                key={result.id}
                result={result}
                mode={mode}
                onClick={() => handleResultClick(result)}
              />
            ))}
          </div>
        )}

        {/* Empty State - no query */}
        {!isLoading && !hasSearched && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center px-6 py-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--accent-glow)" }}
              >
                {mode === "text" ? (
                  <Search size={24} style={{ color: "var(--accent-primary)" }} />
                ) : (
                  <Sparkles size={24} style={{ color: "var(--accent-secondary)" }} />
                )}
              </div>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {mode === "text"
                  ? "Search across all files"
                  : "Semantic code search"}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                {mode === "text"
                  ? "Use regex and case-sensitive matching"
                  : "Find code by meaning, not just text"}
              </p>
            </div>
          </div>
        )}

        {/* Empty State - no results */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Search
                size={28}
                style={{ color: "var(--text-muted)", margin: "0 auto", opacity: 0.5 }}
              />
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                No results for &quot;{query}&quot;
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Try different keywords or search mode
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Indexing Status Footer */}
      <IndexingStatus />
    </div>
  );
}
