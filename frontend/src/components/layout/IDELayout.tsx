"use client";

import React, { useState, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore } from "@/stores/editorStore";
import { useAuthStore } from "@/stores/authStore";
import Sidebar from "./Sidebar";
import StatusBar from "./StatusBar";
import RightPanel from "./RightPanel";
import BottomPanel from "./BottomPanel";
import CommandPalette from "@/components/command/CommandPalette";
import FileExplorer from "@/components/explorer/FileExplorer";
import GitPanel from "@/components/git/GitPanel";
import SearchPanel from "@/components/search/SearchPanel";
import SettingsPanel from "@/components/settings/SettingsPanel";
import AgentPanel from "@/components/agents/AgentPanel";
import EditorTabs from "@/components/editor/EditorTabs";
import CodeEditor from "@/components/editor/CodeEditor";
import WelcomeTab from "@/components/editor/WelcomeTab";

/* ── Resize Handle ────────────────────────────────── */
function ResizeHandle({
  direction,
  onResize,
}: {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
}) {
  const isHorizontal = direction === "horizontal";
  const handleRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = isHorizontal ? e.clientX : e.clientY;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = (isHorizontal ? ev.clientX : ev.clientY) - startPos;
        onResize(delta);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [isHorizontal, onResize]
  );

  return (
    <div
      ref={handleRef}
      onMouseDown={onMouseDown}
      style={{
        ...(isHorizontal
          ? { width: "1px", cursor: "col-resize", minWidth: "1px" }
          : { height: "1px", cursor: "row-resize", minHeight: "1px" }),
        background: "var(--border-primary)",
        flexShrink: 0,
        transition: "background 0.1s, width 0.1s, height 0.1s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (isHorizontal) el.style.width = "3px";
        else el.style.height = "3px";
        el.style.background = "var(--accent-primary)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (isHorizontal) el.style.width = "1px";
        else el.style.height = "1px";
        el.style.background = "var(--border-primary)";
      }}
    />
  );
}

/* ── VS Code Menu Bar ─────────────────────────────── */
const MENUS = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"];

function MenuBar() {
  const [open, setOpen] = useState<string | null>(null);
  const { toggleBottomPanel, toggleSidebar, toggleRightPanel } = useUIStore();

  const handleMenu = (menu: string) => {
    setOpen(open === menu ? null : menu);
  };

  return (
    <div
      className="vsc-menubar"
      style={{ background: "#3c3c3c", borderBottom: "1px solid #252526" }}
      onMouseLeave={() => setOpen(null)}
    >
      {MENUS.map((menu) => (
        <button
          key={menu}
          className="vsc-menubar-item"
          onClick={() => handleMenu(menu)}
          style={{
            background: open === menu ? "rgba(255,255,255,0.12)" : "transparent",
            border: "none",
            cursor: "default",
            fontFamily: "var(--font-sans)",
          }}
        >
          {menu}
        </button>
      ))}

      {/* Window title center */}
      <div className="vsc-menubar-title">
        NexusCode — AI IDE
      </div>

      {/* Quick actions on right */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          className="vsc-menubar-item"
          onClick={toggleSidebar}
          title="Toggle Sidebar (Ctrl+B)"
          style={{ border: "none", cursor: "default", fontFamily: "var(--font-sans)", fontSize: 11 }}
        >
          ◧
        </button>
        <button
          className="vsc-menubar-item"
          onClick={toggleBottomPanel}
          title="Toggle Terminal (Ctrl+`)"
          style={{ border: "none", cursor: "default", fontFamily: "var(--font-sans)", fontSize: 11 }}
        >
          ⬓
        </button>
        <button
          className="vsc-menubar-item"
          onClick={toggleRightPanel}
          title="Toggle AI Chat"
          style={{ border: "none", cursor: "default", fontFamily: "var(--font-sans)", fontSize: 11 }}
        >
          ◨
        </button>
      </div>
    </div>
  );
}

/* ── Sidebar Content ──────────────────────────────── */
function SidebarContent() {
  const { sidebarTab } = useUIStore();
  switch (sidebarTab) {
    case "files":    return <FileExplorer />;
    case "git":      return <GitPanel />;
    case "search":   return <SearchPanel />;
    case "agents":   return <AgentPanel />;
    case "settings": return <SettingsPanel />;
    default:         return <FileExplorer />;
  }
}

/* ── Main IDE Layout ──────────────────────────────── */
export default function IDELayout() {
  const { isSidebarOpen, isRightPanelOpen, isBottomPanelOpen } = useUIStore();
  const { activeTabId } = useEditorStore();
  const hasActiveFile = activeTabId !== null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(360);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);

  const handleSidebarResize = useCallback(
    (delta: number) => setSidebarWidth((prev) => Math.max(160, Math.min(500, prev + delta))),
    []
  );

  const handleRightResize = useCallback(
    (delta: number) => setRightPanelWidth((prev) => Math.max(260, Math.min(600, prev - delta))),
    []
  );

  const handleBottomResize = useCallback(
    (delta: number) => setBottomPanelHeight((prev) => Math.max(80, Math.min(500, prev - delta))),
    []
  );

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "var(--bg-primary)", fontFamily: "var(--font-sans)" }}
    >
      {/* Command Palette (Ctrl+P) */}
      <CommandPalette />

      {/* VS Code style menu bar */}
      <MenuBar />

      {/* Main content area */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Activity bar (48px icon strip) */}
        <Sidebar />

        {/* Sidebar content panel */}
        {isSidebarOpen && (
          <>
            <div
              style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                maxWidth: sidebarWidth,
                background: "var(--bg-secondary)",
                borderRight: "1px solid var(--border-primary)",
              }}
              className="overflow-hidden shrink-0"
            >
              <SidebarContent />
            </div>
            <ResizeHandle direction="horizontal" onResize={handleSidebarResize} />
          </>
        )}

        {/* Center: editor + terminal */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          {/* Editor area */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            {/* Tab bar */}
            <div style={{ background: "#2d2d30", borderBottom: "1px solid #252526" }}>
              <EditorTabs />
            </div>
            {/* Editor */}
            <div className="flex-1 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
              {hasActiveFile ? <CodeEditor /> : <WelcomeTab />}
            </div>
          </div>

          {/* Bottom panel (terminal) */}
          {isBottomPanelOpen && (
            <>
              <ResizeHandle direction="vertical" onResize={handleBottomResize} />
              <div
                style={{
                  height: bottomPanelHeight,
                  minHeight: bottomPanelHeight,
                  maxHeight: bottomPanelHeight,
                  background: "var(--bg-primary)",
                  borderTop: "1px solid var(--border-primary)",
                }}
                className="overflow-hidden shrink-0"
              >
                <BottomPanel />
              </div>
            </>
          )}
        </div>

        {/* Right panel (AI Chat) */}
        {isRightPanelOpen && (
          <>
            <ResizeHandle direction="horizontal" onResize={handleRightResize} />
            <div
              style={{
                width: rightPanelWidth,
                minWidth: rightPanelWidth,
                maxWidth: rightPanelWidth,
                background: "var(--bg-secondary)",
                borderLeft: "1px solid var(--border-primary)",
              }}
              className="overflow-hidden shrink-0"
            >
              <RightPanel />
            </div>
          </>
        )}
      </div>

      {/* VS Code blue status bar */}
      <StatusBar />
    </div>
  );
}
