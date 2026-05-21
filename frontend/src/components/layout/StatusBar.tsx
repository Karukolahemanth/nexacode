"use client";

import React from "react";
import {
  GitBranch,
  Wifi,
  WifiOff,
  Bell,
  Columns2,
  Terminal,
  MessageSquare,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore } from "@/stores/editorStore";
import UserMenu from "./UserMenu";

export default function StatusBar() {
  const { isConnected, toggleBottomPanel, toggleRightPanel } = useUIStore();
  const activeTab = useEditorStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab;
  });

  return (
    <div
      className="flex items-center justify-between px-2 select-none"
      style={{
        height: "22px",
        minHeight: "22px",
        background: "#007acc",
        color: "white",
        fontSize: "12px",
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 cursor-pointer">
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? "Connected" : "Offline"}</span>
        </div>

        {/* Git branch */}
        <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 cursor-pointer">
          <GitBranch size={12} />
          <span>main</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Language */}
        {activeTab && (
          <span className="opacity-90 capitalize">{activeTab.language}</span>
        )}

        {/* Panel toggles */}
        <button
          onClick={toggleBottomPanel}
          className="opacity-90 hover:opacity-100"
          title="Toggle Terminal"
        >
          <Terminal size={12} />
        </button>

        <button
          onClick={toggleRightPanel}
          className="opacity-90 hover:opacity-100"
          title="Toggle AI Chat"
        >
          <MessageSquare size={12} />
        </button>

        <button className="opacity-90 hover:opacity-100" title="Layout">
          <Columns2 size={12} />
        </button>

        <button className="opacity-90 hover:opacity-100" title="Notifications">
          <Bell size={12} />
        </button>

        {/* User menu */}
        <UserMenu />
      </div>
    </div>
  );
}
