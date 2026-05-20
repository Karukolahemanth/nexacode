"use client";

import React from "react";
import { Plus, X, SquareTerminal } from "lucide-react";
import { useTerminalStore } from "@/stores/terminalStore";
import TerminalPanel from "@/components/terminal/TerminalPanel";
import { cn } from "@/lib/utils";

export default function BottomPanel() {
  const { sessions, activeSessionId, setActiveSession, createSession, removeSession } = useTerminalStore();

  return (
    <div className="flex flex-col h-full w-full" style={{ background: "var(--bg-primary)" }}>
      {/* Terminal tab bar */}
      <div
        className="flex items-center justify-between px-1 shrink-0 select-none"
        style={{
          height: "32px",
          minHeight: "32px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-primary)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs rounded-t transition-colors",
                session.id === activeSessionId
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
              style={{
                background: session.id === activeSessionId ? "var(--bg-primary)" : "transparent",
              }}
            >
              <SquareTerminal size={12} />
              <span>{session.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button
            onClick={() => createSession()}
            className="p-1 rounded hover:bg-white/5"
            style={{ color: "var(--text-tertiary)" }}
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Terminal content - must fill remaining space */}
      <div className="flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
        <TerminalPanel />
      </div>
    </div>
  );
}
