"use client";

import React, { useState, useCallback, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore } from "@/stores/editorStore";
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
          ? { width: "4px", cursor: "col-resize", minWidth: "4px" }
          : { height: "4px", cursor: "row-resize", minHeight: "4px" }),
        background: "var(--border-primary)",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--border-primary)";
      }}
    />
  );
}

/* ── Sidebar Content ──────────────────────────────── */
function SidebarContent() {
  const { sidebarTab } = useUIStore();
  switch (sidebarTab) {
    case "files":
      return <FileExplorer />;
    case "git":
      return <GitPanel />;
    case "search":
      return <SearchPanel />;
    case "agents":
      return <AgentPanel />;
    case "settings":
      return <SettingsPanel />;
    default:
      return <FileExplorer />;
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
    (delta: number) => {
      setSidebarWidth((prev) => Math.max(160, Math.min(500, prev + delta)));
    },
    []
  );

  const handleRightResize = useCallback(
    (delta: number) => {
      setRightPanelWidth((prev) => Math.max(260, Math.min(600, prev - delta)));
    },
    []
  );

  const handleBottomResize = useCallback(
    (delta: number) => {
      setBottomPanelHeight((prev) => Math.max(80, Math.min(500, prev - delta)));
    },
    []
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Command Palette (Ctrl+P) */}
      <CommandPalette />

      {/* Main content area — no TitleBar, straight into IDE */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Activity bar (48px icon strip) */}
        <Sidebar />

        {/* Sidebar content panel (file explorer, git, settings, etc.) */}
        {isSidebarOpen && (
          <>
            <div style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }} className="overflow-hidden shrink-0">
              <SidebarContent />
            </div>
            <ResizeHandle direction="horizontal" onResize={handleSidebarResize} />
          </>
        )}

        {/* Center area: editor + bottom terminal */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          {/* Editor area */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <EditorTabs />
            <div className="flex-1 overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              {hasActiveFile ? <CodeEditor /> : <WelcomeTab />}
            </div>
          </div>

          {/* Bottom panel (terminal) */}
          {isBottomPanelOpen && (
            <>
              <ResizeHandle direction="vertical" onResize={handleBottomResize} />
              <div style={{ height: bottomPanelHeight, minHeight: bottomPanelHeight, maxHeight: bottomPanelHeight }} className="overflow-hidden shrink-0">
                <BottomPanel />
              </div>
            </>
          )}
        </div>

        {/* Right panel (AI Chat) */}
        {isRightPanelOpen && (
          <>
            <ResizeHandle direction="horizontal" onResize={handleRightResize} />
            <div style={{ width: rightPanelWidth, minWidth: rightPanelWidth, maxWidth: rightPanelWidth }} className="overflow-hidden shrink-0">
              <RightPanel />
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
