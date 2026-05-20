"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Send, Square, AtSign, X, Paperclip } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useFileStore, type FileNode } from "@/stores/fileStore";

/* ── File Mention Popover ────────────────────── */
function MentionPopover({
  query,
  onSelect,
  onClose,
}: {
  query: string;
  onSelect: (path: string, name: string) => void;
  onClose: () => void;
}) {
  const fileTree = useFileStore((s) => s.fileTree);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten file tree
  const allFiles: { name: string; path: string }[] = [];
  const traverse = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === "file") {
        allFiles.push({ name: node.name, path: node.path });
      }
      if (node.children) traverse(node.children);
    }
  };
  traverse(fileTree);

  const filtered = query
    ? allFiles.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : allFiles.slice(0, 8);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden z-10"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-secondary)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
        animation: "slideInUp 0.12s ease-out",
      }}
    >
      <div className="px-3 py-1.5" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Reference a file
        </span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {filtered.map((file, i) => (
          <button
            key={file.path}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors"
            style={{
              background: i === selectedIndex ? "var(--bg-hover)" : "transparent",
              color: "var(--text-primary)",
            }}
            onClick={() => onSelect(file.path, file.name)}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <AtSign size={11} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
            <span className="truncate">{file.name}</span>
            <span className="ml-auto truncate text-[10px]" style={{ color: "var(--text-muted)", maxWidth: "200px" }}>
              {file.path}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Context File Chip ───────────────────────── */
function ContextChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all"
      style={{
        background: "var(--accent-glow)",
        color: "var(--accent-primary-hover)",
        border: "1px solid var(--border-accent)",
      }}
    >
      <Paperclip size={10} />
      {name}
      <button onClick={onRemove} className="ml-0.5 hover:text-white transition-colors">
        <X size={10} />
      </button>
    </span>
  );
}

/* ── Main Chat Input ─────────────────────────── */
export default function ChatInput({ onSend }: { onSend: (content: string, contextFiles?: string[]) => void }) {
  const inputValue = useChatStore((s) => s.inputValue);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [contextFiles, setContextFiles] = useState<{ path: string; name: string }[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }, []);

  useEffect(() => { adjustHeight(); }, [inputValue, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMention(true);
      setMentionQuery(atMatch[1]);
    } else {
      setShowMention(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (path: string, name: string) => {
    // Add file to context chips
    if (!contextFiles.find((f) => f.path === path)) {
      setContextFiles([...contextFiles, { path, name }]);
    }
    // Remove @query from input
    const cursorPos = textareaRef.current?.selectionStart ?? inputValue.length;
    const textBefore = inputValue.slice(0, cursorPos);
    const textAfter = inputValue.slice(cursorPos);
    const cleaned = textBefore.replace(/@\w*$/, "") + textAfter;
    setInputValue(cleaned);
    setShowMention(false);
    textareaRef.current?.focus();
  };

  const handleRemoveContext = (path: string) => {
    setContextFiles(contextFiles.filter((f) => f.path !== path));
  };

  const handleSend = () => {
    const value = inputValue.trim();
    if (!value || isStreaming) return;
    onSend(value, contextFiles.map((f) => f.path));
    setInputValue("");
    setContextFiles([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && showMention) {
      setShowMention(false);
    }
  };

  return (
    <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border-primary)" }}>
      {/* Context file chips */}
      {contextFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {contextFiles.map((f) => (
            <ContextChip key={f.path} name={f.name} onRemove={() => handleRemoveContext(f.path)} />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        {/* Mention popover */}
        {showMention && (
          <MentionPopover
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setShowMention(false)}
          />
        )}

        <div
          className="flex items-end gap-2 rounded-xl p-2 transition-all"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Generating response..." : "Ask anything... (@ to reference files)"}
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent outline-none text-[13px] disabled:opacity-50 placeholder:text-[var(--text-muted)]"
            style={{ color: "var(--text-primary)", maxHeight: "150px", minHeight: "20px", lineHeight: "1.5" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all flex-shrink-0 disabled:opacity-30"
            style={{
              background: inputValue.trim() && !isStreaming ? "var(--accent-primary)" : "var(--bg-surface)",
              color: inputValue.trim() && !isStreaming ? "white" : "var(--text-tertiary)",
              boxShadow: inputValue.trim() && !isStreaming ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
            }}
          >
            {isStreaming ? <Square size={14} /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
