"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  GitBranch,
  Search,
  X,
  Clock,
  FileCode2,
  Plus,
  ArrowRight,
  Link2,
  FolderGit2,
  Sparkles,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────── */
interface Workspace {
  id: string;
  name: string;
  path: string;
  lastOpened: string;
  fileCount: number;
  language: string;
  color: string;
}

/* ── Demo Data ─────────────────────────────────────── */
const DEMO_WORKSPACES: Workspace[] = [
  {
    id: "ws-1",
    name: "nexus-ide",
    path: "~/projects/nexus-ide",
    lastOpened: "2 minutes ago",
    fileCount: 128,
    language: "TypeScript",
    color: "var(--accent-primary)",
  },
  {
    id: "ws-2",
    name: "ai-agent-framework",
    path: "~/projects/ai-agent-framework",
    lastOpened: "3 hours ago",
    fileCount: 87,
    language: "Python",
    color: "var(--accent-emerald)",
  },
  {
    id: "ws-3",
    name: "portfolio-site",
    path: "~/projects/portfolio-site",
    lastOpened: "Yesterday",
    fileCount: 42,
    language: "React",
    color: "var(--accent-cyan)",
  },
  {
    id: "ws-4",
    name: "rust-cli-tools",
    path: "~/projects/rust-cli-tools",
    lastOpened: "3 days ago",
    fileCount: 56,
    language: "Rust",
    color: "var(--accent-amber)",
  },
  {
    id: "ws-5",
    name: "mobile-app",
    path: "~/projects/mobile-app",
    lastOpened: "1 week ago",
    fileCount: 210,
    language: "Kotlin",
    color: "var(--accent-secondary)",
  },
];

/* ── Workspace Card ────────────────────────────────── */
function WorkspaceCard({
  workspace,
  index,
  onSelect,
}: {
  workspace: Workspace;
  index: number;
  onSelect: (ws: Workspace) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(workspace)}
      className="w-full text-left"
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-primary)",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "block",
        fontFamily: "var(--font-sans)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-secondary)";
        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${workspace.color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Accent glow line at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${workspace.color}, transparent)`,
          opacity: 0.6,
        }}
      />

      <div className="flex items-start gap-3">
        {/* Folder icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${workspace.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FolderOpen size={20} style={{ color: workspace.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 2,
            }}
          >
            {workspace.name}
          </p>

          {/* Path */}
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {workspace.path}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2">
            <span
              className="flex items-center gap-1"
              style={{ fontSize: 11, color: "var(--text-tertiary)" }}
            >
              <FileCode2 size={11} />
              {workspace.fileCount} files
            </span>
            <span
              className="flex items-center gap-1"
              style={{ fontSize: 11, color: "var(--text-tertiary)" }}
            >
              <Clock size={11} />
              {workspace.lastOpened}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 4,
                background: `${workspace.color}15`,
                color: workspace.color,
                fontWeight: 500,
              }}
            >
              {workspace.language}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight
          size={16}
          style={{
            color: "var(--text-muted)",
            flexShrink: 0,
            marginTop: 12,
          }}
        />
      </div>
    </motion.button>
  );
}

/* ── Clone Repository Section ──────────────────────── */
function CloneSection() {
  const [url, setUrl] = useState("");
  const [showInput, setShowInput] = useState(false);

  return (
    <div style={{ marginTop: 4 }}>
      {!showInput ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 w-full"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.15)",
            color: "var(--accent-cyan)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(34,211,238,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(34,211,238,0.06)";
          }}
        >
          <FolderGit2 size={16} />
          Clone Repository
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <Link2 size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              autoFocus
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                fontFamily: "var(--font-mono)",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
              }}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowInput(false)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Demo: just close
                setUrl("");
                setShowInput(false);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "var(--accent-cyan)",
                border: "none",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Clone
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Main Workspace Manager ────────────────────────── */
export default function WorkspaceManager({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return DEMO_WORKSPACES;
    const q = search.toLowerCase();
    return DEMO_WORKSPACES.filter(
      (ws) =>
        ws.name.toLowerCase().includes(q) ||
        ws.path.toLowerCase().includes(q) ||
        ws.language.toLowerCase().includes(q)
    );
  }, [search]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSelect = (ws: Workspace) => {
    // In demo mode, just close the modal
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            fontFamily: "var(--font-sans)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "80vh",
              borderRadius: 16,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-secondary)",
              boxShadow:
                "0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              margin: "0 16px",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 shrink-0"
              style={{
                height: 56,
                borderBottom: "1px solid var(--border-primary)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--accent-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={15} style={{ color: "var(--accent-primary)" }} />
                </div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Workspaces
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  borderRadius: 6,
                  display: "flex",
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "none";
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search + Actions */}
            <div className="px-5 pt-4 pb-2 shrink-0">
              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workspaces..."
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 38px",
                    borderRadius: 10,
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "var(--font-sans)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                  }}
                />
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    border: "none",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
                  }}
                >
                  <Plus size={14} />
                  Open Folder
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-secondary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <GitBranch size={14} />
                  New Workspace
                </motion.button>
              </div>
            </div>

            {/* Recent header */}
            <div className="px-5 pt-2 pb-1 shrink-0">
              <p
                className="flex items-center gap-1.5"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                }}
              >
                <Clock size={11} />
                Recent Workspaces
              </p>
            </div>

            {/* Workspace list */}
            <div
              className="flex-1 overflow-y-auto px-5 pb-4"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingTop: 8,
              }}
            >
              {filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Search size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13 }}>No workspaces found</p>
                  <p style={{ fontSize: 12, marginTop: 2 }}>
                    Try a different search term
                  </p>
                </div>
              ) : (
                filtered.map((ws, i) => (
                  <WorkspaceCard
                    key={ws.id}
                    workspace={ws}
                    index={i}
                    onSelect={handleSelect}
                  />
                ))
              )}

              {/* Clone section at bottom */}
              <CloneSection />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
