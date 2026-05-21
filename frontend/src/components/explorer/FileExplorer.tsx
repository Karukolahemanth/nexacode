"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFileStore, type FileNode } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";
import { getFileIcon, getFolderIcon } from "@/lib/fileIcons";
import { getFileExtension, getLanguageFromExtension } from "@/lib/utils";
import {
  ChevronRight, ChevronDown, RefreshCw, Plus, FolderPlus,
  Pencil, Trash2, Copy, FilePlus, FolderOpen, FileCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Context Menu ────────────────────────────────── */
interface CtxMenuProps {
  x: number;
  y: number;
  node: FileNode | null;
  onClose: () => void;
  onRename: (node: FileNode) => void;
  onDelete: (node: FileNode) => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onCopyPath: (path: string) => void;
}

function ContextMenu({ x, y, node, onClose, onRename, onDelete, onNewFile, onNewFolder, onCopyPath }: CtxMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Adjust position so menu stays in viewport
  const menuW = 180;
  const menuH = 220;
  const left = x + menuW > window.innerWidth ? x - menuW : x;
  const top  = y + menuH > window.innerHeight ? y - menuH : y;

  const isDir = node?.type === "directory";

  const item = (icon: React.ReactNode, label: string, action: () => void, danger = false) => (
    <button
      onClick={() => { action(); onClose(); }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "5px 12px",
        fontSize: 12, color: danger ? "#f44747" : "#d4d4d4",
        background: "transparent", border: "none", cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? "rgba(244,71,71,0.12)" : "#094771")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {label}
    </button>
  );

  const divider = () => <div style={{ height: 1, background: "#454545", margin: "3px 0" }} />;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", left, top, zIndex: 9999,
        background: "#252526", border: "1px solid #454545",
        boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
        minWidth: menuW, paddingTop: 4, paddingBottom: 4,
        userSelect: "none",
      }}
    >
      {node && (
        <>
          {item(<Pencil size={13} />, "Rename", () => onRename(node))}
          {item(<Trash2 size={13} />, "Delete", () => onDelete(node), true)}
          {divider()}
          {item(<Copy size={13} />, "Copy Path", () => onCopyPath(node.path))}
          {divider()}
        </>
      )}
      {(isDir || !node) && (
        <>
          {item(<FilePlus size={13} />, "New File", () => onNewFile(node?.path ?? ""))}
          {item(<FolderPlus size={13} />, "New Folder", () => onNewFolder(node?.path ?? ""))}
        </>
      )}
    </div>
  );
}

/* ── Inline rename input ─────────────────────────── */
function RenameInput({ value, onConfirm, onCancel }: { value: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <input
      ref={ref}
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") onConfirm(val.trim());
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onConfirm(val.trim())}
      style={{
        flex: 1, background: "#094771", border: "1px solid #0078d4",
        color: "#d4d4d4", fontSize: 13, padding: "0 4px",
        outline: "none", height: 20, borderRadius: 2,
      }}
      autoFocus
    />
  );
}

/* ── File Tree Item ──────────────────────────────── */
function FileTreeItem({
  node, depth = 0, renamingPath, onContextMenu, onRenameConfirm, onRenameCancel,
}: {
  node: FileNode;
  depth?: number;
  renamingPath: string | null;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onRenameConfirm: (node: FileNode, newName: string) => void;
  onRenameCancel: () => void;
}) {
  const { expandedDirs, toggleDir, selectedPath, setSelectedPath } = useFileStore();
  const { fetchAndOpenFile } = useEditorStore();
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === "directory";
  const isRenaming = renamingPath === node.path;

  const handleClick = () => {
    setSelectedPath(node.path);
    if (isDirectory) {
      toggleDir(node.path);
    } else {
      fetchAndOpenFile(node.path, node.name);
    }
  };

  const { icon: FileIcon, color: iconColor } = isDirectory
    ? getFolderIcon(node.name, isExpanded)
    : getFileIcon(node.name);

  return (
    <div>
      <div
        className="flex items-center w-full group"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          paddingRight: "8px",
          height: "22px",
          fontSize: "13px",
          color: isSelected ? "#d4d4d4" : "#c8c8c8",
          background: isSelected ? "#094771" : "transparent",
          cursor: "pointer",
        }}
        onClick={handleClick}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, node); }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#2a2d2e"; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Chevron */}
        {isDirectory ? (
          <span style={{ display: "flex", alignItems: "center", width: 16, flexShrink: 0, marginRight: 2 }}>
            {isExpanded
              ? <ChevronDown size={14} style={{ color: "#858585" }} />
              : <ChevronRight size={14} style={{ color: "#858585" }} />}
          </span>
        ) : (
          <span style={{ width: 18, flexShrink: 0 }} />
        )}

        {/* Icon */}
        <FileIcon size={15} style={{ color: iconColor, flexShrink: 0, marginRight: 6 }} />

        {/* Name / Rename input */}
        {isRenaming ? (
          <RenameInput
            value={node.name}
            onConfirm={v => onRenameConfirm(node, v)}
            onCancel={onRenameCancel}
          />
        ) : (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isDirectory && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{ overflow: "hidden" }}
          >
            {sortNodes(node.children).map(child => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                renamingPath={renamingPath}
                onContextMenu={onContextMenu}
                onRenameConfirm={onRenameConfirm}
                onRenameCancel={onRenameCancel}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type === "directory" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });
}

/* ── Toast notification ──────────────────────────── */
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
      background: "#252526", border: "1px solid #454545", color: "#d4d4d4",
      padding: "6px 16px", fontSize: 12, borderRadius: 4,
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 9999, pointerEvents: "none",
    }}>
      {msg}
    </div>
  );
}

/* ── Main FileExplorer ───────────────────────────── */
export default function FileExplorer() {
  const { fileTree, currentProject, fetchFileTree, addFile, addFolder, deleteNode, renameNode } = useFileStore();

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; node: FileNode | null } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleRename = (node: FileNode) => {
    setRenamingPath(node.path);
  };

  const handleRenameConfirm = (node: FileNode, newName: string) => {
    if (newName && newName !== node.name) {
      if (typeof renameNode === "function") {
        renameNode(node.path, newName);
        showToast(`Renamed to "${newName}"`);
      }
    }
    setRenamingPath(null);
  };

  const handleDelete = (node: FileNode) => {
    if (confirm(`Delete "${node.name}"?`)) {
      if (typeof deleteNode === "function") {
        deleteNode(node.path);
        showToast(`Deleted "${node.name}"`);
      }
    }
  };

  const handleNewFile = (parentPath: string) => {
    const name = prompt("New file name:");
    if (!name) return;
    if (typeof addFile === "function") {
      addFile(parentPath, name);
      showToast(`Created "${name}"`);
    }
  };

  const handleNewFolder = (parentPath: string) => {
    const name = prompt("New folder name:");
    if (!name) return;
    if (typeof addFolder === "function") {
      addFolder(parentPath, name);
      showToast(`Created folder "${name}"`);
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    showToast("Path copied!");
  };

  // Right-click on empty area
  const handleBgContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, node: null });
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--bg-secondary)" }}
      onContextMenu={handleBgContextMenu}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 select-none"
        style={{ height: "36px", minHeight: "36px", borderBottom: "1px solid var(--border-primary)" }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#bbb" }}>
          Explorer
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            title="New File (right-click for options)"
            onClick={() => handleNewFile("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#858585", padding: 4, display: "flex", borderRadius: 3 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d4")}
            onMouseLeave={e => (e.currentTarget.style.color = "#858585")}
          >
            <Plus size={15} />
          </button>
          <button
            title="New Folder"
            onClick={() => handleNewFolder("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#858585", padding: 4, display: "flex", borderRadius: 3 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d4")}
            onMouseLeave={e => (e.currentTarget.style.color = "#858585")}
          >
            <FolderPlus size={15} />
          </button>
          <button
            title="Refresh"
            onClick={() => fetchFileTree()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#858585", padding: 4, display: "flex", borderRadius: 3 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d4")}
            onMouseLeave={e => (e.currentTarget.style.color = "#858585")}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Project name */}
      {currentProject && (
        <div style={{
          padding: "4px 12px", fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.05em",
          color: "#cccccc", borderBottom: "1px solid var(--border-primary)",
        }}>
          {currentProject}
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {fileTree.map(node => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            renamingPath={renamingPath}
            onContextMenu={handleContextMenu}
            onRenameConfirm={handleRenameConfirm}
            onRenameCancel={() => setRenamingPath(null)}
          />
        ))}
        {fileTree.length === 0 && (
          <div style={{ padding: "20px 16px", fontSize: 12, color: "#858585", textAlign: "center" }}>
            <FileCode size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <p>No files yet</p>
            <p style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>Right-click to create files</p>
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          node={ctxMenu.node}
          onClose={() => setCtxMenu(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onCopyPath={handleCopyPath}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} />}
    </div>
  );
}
