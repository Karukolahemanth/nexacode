"use client";

import React from "react";
import { GitBranch, GitCommit, Plus, Minus, FileEdit, RefreshCw } from "lucide-react";

const demoChanges = [
  { file: "src/app/page.tsx", status: "modified" as const, additions: 12, deletions: 3 },
  { file: "src/components/layout/IDELayout.tsx", status: "modified" as const, additions: 45, deletions: 8 },
  { file: "src/stores/chatStore.ts", status: "added" as const, additions: 62, deletions: 0 },
  { file: "src/lib/themes.ts", status: "added" as const, additions: 88, deletions: 0 },
];

const statusIcons = {
  modified: { icon: FileEdit, color: "var(--accent-amber)" },
  added: { icon: Plus, color: "var(--accent-emerald)" },
  deleted: { icon: Minus, color: "var(--accent-rose)" },
};

export default function GitPanel() {
  return (
    <div className="h-full flex flex-col animate-fade-in" style={{ background: "var(--bg-secondary)" }}>
      <div className="flex items-center justify-between px-3 py-2 select-none" style={{ height: "36px", minHeight: "36px", borderBottom: "1px solid var(--border-primary)" }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Source Control</span>
        <button className="p-1 rounded hover:bg-white/5" style={{ color: "var(--text-tertiary)" }}><RefreshCw size={14} /></button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <GitBranch size={14} style={{ color: "var(--accent-primary)" }} />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>main</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-glow)", color: "var(--accent-primary-hover)" }}>{demoChanges.length} changes</span>
      </div>
      <div className="px-3 py-2">
        <input type="text" placeholder="Commit message" className="w-full px-3 py-1.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
        <button className="w-full mt-2 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: "var(--accent-primary)", color: "white" }}>
          <GitCommit size={14} /> Commit
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Changes</div>
        {demoChanges.map((change) => {
          const { icon: StatusIcon, color } = statusIcons[change.status];
          return (
            <div key={change.file} className="flex items-center gap-2 px-3 py-1 cursor-pointer hover-bg">
              <StatusIcon size={14} style={{ color }} />
              <span className="flex-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>{change.file}</span>
              <div className="flex items-center gap-1 text-xs">
                {change.additions > 0 && <span style={{ color: "var(--accent-emerald)" }}>+{change.additions}</span>}
                {change.deletions > 0 && <span style={{ color: "var(--accent-rose)" }}>-{change.deletions}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
