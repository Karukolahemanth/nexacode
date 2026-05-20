"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, FileText, ArrowRight, Command, Terminal, MessageSquare, PanelLeft, Trash2 } from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { getFileIcon } from "@/lib/fileIcons";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  type: "file" | "command";
  icon?: React.ReactNode;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fileTree = useFileStore((s) => s.fileTree);
  const openFile = useEditorStore((s) => s.openFile);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const clearMessages = useChatStore((s) => s.clearMessages);

  // Flatten file tree
  const allFiles = useMemo(() => {
    const result: CommandItem[] = [];
    const traverse = (nodes: any[], prefix = "") => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        const path = prefix ? `${prefix}/${node.name}` : node.name;
        if (node.type === "file") {
          const { icon: Icon, color } = getFileIcon(node.name);
          result.push({
            id: path,
            label: node.name,
            description: path,
            type: "file",
            icon: <Icon size={14} style={{ color }} />,
            action: () => {
              const ext = node.name.split(".").pop()?.toLowerCase() || "";
              openFile({ path: node.path, name: node.name, language: ext, content: `// ${node.name}\n` });
              setIsOpen(false);
            },
          });
        }
        if (node.children) traverse(node.children, path);
      }
    };
    traverse(fileTree);
    return result;
  }, [fileTree, openFile]);

  const commands: CommandItem[] = useMemo(() => [
    { id: "cmd:terminal", label: "Toggle Terminal", description: "Show/hide terminal", type: "command", icon: <Terminal size={14} style={{ color: "var(--accent-cyan)" }} />, action: () => { toggleBottomPanel(); setIsOpen(false); } },
    { id: "cmd:chat", label: "Toggle AI Chat", description: "Show/hide chat panel", type: "command", icon: <MessageSquare size={14} style={{ color: "var(--accent-primary)" }} />, action: () => { toggleRightPanel(); setIsOpen(false); } },
    { id: "cmd:sidebar", label: "Toggle Sidebar", description: "Show/hide file explorer", type: "command", icon: <PanelLeft size={14} style={{ color: "var(--accent-emerald)" }} />, action: () => { toggleSidebar(); setIsOpen(false); } },
    { id: "cmd:clear", label: "Clear Chat History", description: "Reset conversation", type: "command", icon: <Trash2 size={14} style={{ color: "var(--accent-rose)" }} />, action: () => { clearMessages(); setIsOpen(false); } },
  ], [toggleBottomPanel, toggleRightPanel, toggleSidebar, clearMessages]);

  const filteredItems = useMemo(() => {
    const isCmd = query.startsWith(">");
    const q = (isCmd ? query.slice(1) : query).toLowerCase().trim();
    if (!q) return isCmd ? commands : allFiles.slice(0, 15);
    const source = isCmd ? commands : [...allFiles, ...commands];
    return source.filter((item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)).slice(0, 20);
  }, [query, allFiles, commands]);

  useEffect(() => { setSelectedIndex(0); }, [filteredItems]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); setIsOpen((p) => !p); setQuery(""); }
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((p) => Math.min(p + 1, filteredItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((p) => Math.max(p - 1, 0)); }
    else if (e.key === "Enter" && filteredItems[selectedIndex]) { e.preventDefault(); filteredItems[selectedIndex].action(); }
  };

  useEffect(() => { (listRef.current?.children[selectedIndex] as HTMLElement)?.scrollIntoView({ block: "nearest" }); }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setIsOpen(false)} />
      <div className="fixed z-50 left-1/2 -translate-x-1/2 w-[560px] rounded-xl overflow-hidden" style={{ top: "15%", background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)", boxShadow: "0 25px 50px rgba(0,0,0,0.5), var(--shadow-glow)", animation: "slideInUp 0.15s ease-out" }}>
        <div className="flex items-center gap-3 px-4" style={{ height: "48px", borderBottom: "1px solid var(--border-primary)" }}>
          <Search size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search files or type > for commands..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }} />
          <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border-primary)" }}>ESC</kbd>
        </div>
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: "320px" }}>
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>No results found</p></div>
          ) : filteredItems.map((item, i) => (
            <button key={item.id} onClick={item.action} onMouseEnter={() => setSelectedIndex(i)} className="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors" style={{ background: i === selectedIndex ? "var(--bg-hover)" : "transparent", color: "var(--text-primary)" }}>
              <span className="flex-shrink-0">{item.icon || <FileText size={14} style={{ color: "var(--text-muted)" }} />}</span>
              <span className="flex-1 min-w-0">
                <span className="text-sm">{item.label}</span>
                {item.description && <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{item.description}</span>}
              </span>
              <ArrowRight size={12} style={{ color: "var(--text-muted)", opacity: i === selectedIndex ? 1 : 0 }} />
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ borderTop: "1px solid var(--border-primary)", color: "var(--text-muted)" }}>
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
          <span>Type &gt; for commands</span>
        </div>
      </div>
    </>
  );
}
