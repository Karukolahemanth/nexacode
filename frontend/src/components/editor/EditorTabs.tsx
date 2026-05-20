"use client";

import React from "react";
import { X, Circle } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { getFileIcon } from "@/lib/fileIcons";
import { cn } from "@/lib/utils";

export default function EditorTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-center overflow-x-auto"
      style={{
        height: "36px",
        minHeight: "36px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-primary)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const { icon: FileIcon, color: iconColor } = getFileIcon(tab.name);

        return (
          <div
            key={tab.id}
            className={cn(
              "tab-item group",
              isActive && "active"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <FileIcon size={14} style={{ color: iconColor }} />
            <span>{tab.name}</span>

            {/* Dirty indicator or close button */}
            <button
              className={cn(
                "flex items-center justify-center w-4 h-4 rounded-sm ml-1",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                tab.isDirty && "opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              title="Close"
            >
              {tab.isDirty ? (
                <Circle
                  size={8}
                  fill="var(--text-secondary)"
                  stroke="none"
                />
              ) : (
                <X
                  size={14}
                  className="hover:bg-white/10 rounded-sm"
                  style={{ color: "var(--text-tertiary)" }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
