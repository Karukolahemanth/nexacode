"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  ChevronDown,
  FileCode,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

/* ── Types ─────────────────────────────────────── */
export interface CodeReference {
  id: string;
  filePath: string;
  fileName: string;
  startLine: number;
  endLine: number;
  relevanceScore: number; // 0-1
  codePreview: string;
  language: string;
}

/* ── Demo Data ─────────────────────────────────── */
export const DEMO_CODE_REFERENCES: CodeReference[] = [
  {
    id: "ref1",
    filePath: "src/stores/chatStore.ts",
    fileName: "chatStore.ts",
    startLine: 105,
    endLine: 124,
    relevanceScore: 0.96,
    codePreview: `addMessage: (msg) => {
  const id = \`msg-\${Date.now()}\`;
  const newMsg = { ...msg, id, timestamp: Date.now() };
  set((state) => ({ ... }));`,
    language: "typescript",
  },
  {
    id: "ref2",
    filePath: "src/components/chat/ChatMessage.tsx",
    fileName: "ChatMessage.tsx",
    startLine: 87,
    endLine: 104,
    relevanceScore: 0.91,
    codePreview: `export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const handleCopyAll = () => { ... };`,
    language: "typescript",
  },
  {
    id: "ref3",
    filePath: "src/hooks/useWebSocket.ts",
    fileName: "useWebSocket.ts",
    startLine: 22,
    endLine: 40,
    relevanceScore: 0.84,
    codePreview: `const sendMessage = useCallback((data) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }`,
    language: "typescript",
  },
  {
    id: "ref4",
    filePath: "src/components/chat/ChatInput.tsx",
    fileName: "ChatInput.tsx",
    startLine: 45,
    endLine: 62,
    relevanceScore: 0.72,
    codePreview: `const handleSubmit = async () => {
  if (!inputValue.trim()) return;
  addMessage({ role: "user", content: inputValue });
  setInputValue("");`,
    language: "typescript",
  },
];

/* ── Relevance Bar ─────────────────────────────── */
function RelevanceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  let color = "var(--accent-emerald)";
  let label = "High";
  if (pct < 60) {
    color = "var(--accent-amber)";
    label = "Low";
  } else if (pct < 80) {
    color = "var(--accent-cyan)";
    label = "Medium";
  }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="rounded-full overflow-hidden"
        style={{ width: "48px", height: "4px", background: "var(--bg-primary)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            transition: "width 0.5s ease-out",
          }}
        />
      </div>
      <span className="text-[9px] font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Single Reference Card ─────────────────────── */
function ReferenceCard({ codeRef }: { codeRef: CodeReference }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openFile } = useEditorStore();

  const handleOpen = () => {
    openFile({
      path: codeRef.filePath,
      name: codeRef.fileName,
      language: codeRef.language,
      content: `// ${codeRef.fileName} — Lines ${codeRef.startLine}-${codeRef.endLine}\n\n${codeRef.codePreview}`,
    });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeRef.codePreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-primary)",
        border: `1px solid ${hovered ? "var(--border-accent)" : "var(--border-primary)"}`,
        boxShadow: hovered ? "0 0 12px rgba(99, 102, 241, 0.06)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      {/* Ref header */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5"
        style={{
          borderBottom: "1px solid var(--border-primary)",
          background: hovered ? "rgba(99, 102, 241, 0.03)" : "transparent",
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCode size={11} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {codeRef.fileName}
          </span>
          <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
            L{codeRef.startLine}–{codeRef.endLine}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <RelevanceBar score={codeRef.relevanceScore} />
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check size={10} style={{ color: "var(--accent-emerald)" }} />
            ) : (
              <Copy size={10} style={{ color: "var(--text-muted)" }} />
            )}
          </button>
          <button
            onClick={handleOpen}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="Open in editor"
          >
            <ExternalLink size={10} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {/* Code preview */}
      <button
        onClick={handleOpen}
        className="w-full text-left cursor-pointer"
      >
        <pre
          className="px-2.5 py-2 overflow-x-auto text-[11px] leading-[1.6]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
            maxHeight: "80px",
            margin: 0,
          }}
        >
          <code>{codeRef.codePreview}</code>
        </pre>
      </button>
    </div>
  );
}

/* ── Main Code Context Card ────────────────────── */
export default function CodeContext({
  references = DEMO_CODE_REFERENCES,
}: {
  references?: CodeReference[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [references, isExpanded]);

  if (!references.length) return null;

  return (
    <div
      className="rounded-xl overflow-hidden my-2"
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-primary)",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "0 2px 6px rgba(99, 102, 241, 0.25)",
            }}
          >
            <BookOpen size={12} className="text-white" />
          </div>
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
            📚 {references.length} code reference{references.length !== 1 ? "s" : ""} found
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
            {isExpanded ? "Collapse" : "Expand"}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-muted)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
            }}
          />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        style={{
          maxHeight: isExpanded ? `${contentHeight + 20}px` : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div ref={contentRef} className="px-3 pb-3 flex flex-col gap-2">
          {references.map((codeRef) => (
            <ReferenceCard key={codeRef.id} codeRef={codeRef} />
          ))}

          {/* Summary footer */}
          <div
            className="flex items-center justify-between pt-1.5"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          >
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              Relevance range:{" "}
              <span style={{ color: "var(--accent-emerald)" }}>
                {Math.round(Math.min(...references.map((r) => r.relevanceScore)) * 100)}%
              </span>
              {" – "}
              <span style={{ color: "var(--accent-emerald)" }}>
                {Math.round(Math.max(...references.map((r) => r.relevanceScore)) * 100)}%
              </span>
            </span>
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              {new Set(references.map((r) => r.filePath)).size} files
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
