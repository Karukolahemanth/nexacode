"use client";

import React from "react";
import {
  Files,
  Search,
  GitBranch,
  Bot,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useUIStore, type SidebarTab } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

interface SidebarIcon {
  id: SidebarTab;
  icon: LucideIcon;
  label: string;
}

const topIcons: SidebarIcon[] = [
  { id: "files", icon: Files, label: "Explorer" },
  { id: "search", icon: Search, label: "Search" },
  { id: "git", icon: GitBranch, label: "Source Control" },
  { id: "agents", icon: Bot, label: "AI Agents" },
];

const bottomIcons: SidebarIcon[] = [
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { sidebarTab, setSidebarTab, isSidebarOpen } = useUIStore();

  const renderIcon = ({ id, icon: Icon, label }: SidebarIcon) => {
    const isActive = sidebarTab === id && isSidebarOpen;
    return (
      <button
        key={id}
        onClick={() => setSidebarTab(id)}
        title={label}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150",
          isActive
            ? "text-white"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        )}
        style={{
          background: isActive ? "var(--accent-glow)" : "transparent",
        }}
      >
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
            style={{ background: "var(--accent-primary)" }}
          />
        )}
        <Icon size={20} />
      </button>
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-between py-2 shrink-0"
      style={{
        width: "48px",
        minWidth: "48px",
        background: "var(--bg-primary)",
        borderRight: "1px solid var(--border-primary)",
      }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center gap-1">
        {topIcons.map(renderIcon)}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-1">
        {bottomIcons.map(renderIcon)}
      </div>
    </div>
  );
}
