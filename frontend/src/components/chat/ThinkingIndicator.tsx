"use client";

import React from "react";
import { Brain, Search, Code2, Wrench } from "lucide-react";
import type { ThinkingPhase } from "@/stores/chatStore";

const PHASE_CONFIG: Record<ThinkingPhase, { icon: React.ReactNode; text: string; color: string } | null> = {
  idle: null,
  thinking: { icon: <Brain size={13} />, text: "Thinking", color: "var(--accent-primary)" },
  searching: { icon: <Search size={13} />, text: "Searching codebase", color: "var(--accent-cyan)" },
  generating: { icon: <Code2 size={13} />, text: "Generating code", color: "var(--accent-emerald)" },
  tool_calling: { icon: <Wrench size={13} />, text: "Running tool", color: "var(--accent-amber)" },
};

export default function ThinkingIndicator({ phase }: { phase: ThinkingPhase }) {
  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ animation: "chatMessageIn 0.2s ease-out" }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          animation: "pulse-glow 2s ease-in-out infinite",
        }}
      >
        <span className="text-white" style={{ animation: "spin 3s linear infinite" }}>
          {config.icon}
        </span>
      </div>

      {/* Text + dots */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: config.color }}>
          {config.text}
        </span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{
                background: config.color,
                animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
