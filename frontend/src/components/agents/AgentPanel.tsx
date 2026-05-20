"use client";

import React, { useState } from "react";
import {
  Bot,
  Plus,
  Brain,
  Wrench,
  FileCode,
  BookOpen,
  Terminal,
  Search as SearchIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  ChevronDown,
  Trash2,
  CircleDot,
} from "lucide-react";
import {
  useAgentStore,
  type AgentTask,
  type AgentStep,
  type AgentTaskStatus,
  type AgentStepType,
  type AgentStepStatus,
} from "@/stores/agentStore";

/* ── Helpers ────────────────────────────────────── */

const STATUS_CONFIG: Record<AgentTaskStatus, { color: string; label: string }> = {
  idle: { color: "var(--text-muted)", label: "Idle" },
  planning: { color: "var(--accent-amber)", label: "Planning" },
  coding: { color: "var(--accent-primary)", label: "Coding" },
  debugging: { color: "var(--accent-rose)", label: "Debugging" },
  reviewing: { color: "var(--accent-cyan)", label: "Reviewing" },
  complete: { color: "var(--accent-emerald)", label: "Complete" },
  error: { color: "var(--accent-rose)", label: "Error" },
};

const STEP_ICONS: Record<AgentStepType, React.ReactNode> = {
  thinking: <Brain size={13} />,
  tool_call: <Wrench size={13} />,
  code_edit: <FileCode size={13} />,
  file_read: <BookOpen size={13} />,
  terminal: <Terminal size={13} />,
  review: <SearchIcon size={13} />,
};

function formatDuration(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Step Status Icon ───────────────────────────── */
function StepStatusIcon({ status }: { status: AgentStepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={13} style={{ color: "var(--accent-emerald)" }} />;
    case "error":
      return <XCircle size={13} style={{ color: "var(--accent-rose)" }} />;
    case "running":
      return (
        <Loader2
          size={13}
          style={{ color: "var(--accent-primary)", animation: "spin 1s linear infinite" }}
        />
      );
    case "pending":
    default:
      return <Clock size={13} style={{ color: "var(--text-muted)" }} />;
  }
}

/* ── Step Row ───────────────────────────────────── */
function StepRow({ step }: { step: AgentStep }) {
  const [showResult, setShowResult] = useState(false);
  const isRunning = step.status === "running";

  return (
    <div
      className="relative"
      style={{
        animation: isRunning ? "none" : undefined,
      }}
    >
      <button
        onClick={() => step.result && setShowResult(!showResult)}
        className="w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors"
        style={{
          background: isRunning ? "rgba(99, 102, 241, 0.04)" : "transparent",
          cursor: step.result ? "pointer" : "default",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isRunning
            ? "rgba(99, 102, 241, 0.08)"
            : "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isRunning
            ? "rgba(99, 102, 241, 0.04)"
            : "transparent";
        }}
      >
        {/* Running pulse indicator */}
        {isRunning && (
          <div
            className="absolute left-0 top-0 bottom-0 w-[2px]"
            style={{
              background: "var(--accent-primary)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        )}

        {/* Step type icon */}
        <div
          className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5"
          style={{
            background: isRunning ? "var(--accent-glow)" : "var(--bg-surface)",
            color: isRunning ? "var(--accent-primary)" : "var(--text-tertiary)",
          }}
        >
          {STEP_ICONS[step.type]}
        </div>

        {/* Description + duration */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs leading-snug truncate"
            style={{
              color:
                step.status === "pending"
                  ? "var(--text-muted)"
                  : "var(--text-secondary)",
            }}
          >
            {step.description}
          </p>
          {step.duration != null && (
            <span
              className="text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              {formatDuration(step.duration)}
            </span>
          )}
        </div>

        {/* Status icon */}
        <div className="shrink-0 mt-1">
          <StepStatusIcon status={step.status} />
        </div>
      </button>

      {/* Result expandable */}
      {showResult && step.result && (
        <div
          className="mx-3 mb-2 px-3 py-2 rounded-md text-[11px] leading-relaxed"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            animation: "slideDown 0.15s ease-out",
          }}
        >
          {step.result}
        </div>
      )}
    </div>
  );
}

/* ── Task Card ──────────────────────────────────── */
function TaskCard({ task }: { task: AgentTask }) {
  const { activeTaskId, setActiveTask, removeTask } = useAgentStore();
  const isExpanded = activeTaskId === task.id;
  const config = STATUS_CONFIG[task.status];
  const completedSteps = task.steps.filter((s) => s.status === "done").length;
  const totalSteps = task.steps.length;
  const isActive = task.status !== "complete" && task.status !== "error" && task.status !== "idle";

  return (
    <div
      className="overflow-hidden"
      style={{
        border: `1px solid ${isExpanded ? "var(--border-secondary)" : "var(--border-primary)"}`,
        borderRadius: "10px",
        background: isExpanded ? "var(--bg-tertiary)" : "var(--bg-secondary)",
        transition: "all var(--transition-base)",
      }}
    >
      {/* Task header */}
      <button
        onClick={() => setActiveTask(isExpanded ? null : task.id)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left group transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Expand arrow */}
        <div style={{ color: "var(--text-muted)" }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* Status dot */}
        <div className="relative shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: config.color,
              boxShadow: isActive ? `0 0 8px ${config.color}` : "none",
            }}
          />
          {isActive && (
            <div
              className="absolute inset-0 w-2.5 h-2.5 rounded-full"
              style={{
                background: config.color,
                animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                opacity: 0.4,
              }}
            />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-medium"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
            {totalSteps > 0 && (
              <span
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                {completedSteps}/{totalSteps} steps
              </span>
            )}
            <span
              className="text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              {timeAgo(task.createdAt)}
            </span>
          </div>
        </div>

        {/* Delete button */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            removeTask(task.id);
          }}
        >
          <Trash2
            size={13}
            style={{ color: "var(--text-muted)" }}
            className="hover:text-[var(--accent-rose)] transition-colors"
          />
        </div>
      </button>

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div
          className="mx-3 h-[2px] rounded-full overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedSteps / totalSteps) * 100}%`,
              background:
                task.status === "error"
                  ? "var(--accent-rose)"
                  : task.status === "complete"
                  ? "var(--accent-emerald)"
                  : `linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))`,
            }}
          />
        </div>
      )}

      {/* Expanded steps */}
      {isExpanded && (
        <div
          className="py-1"
          style={{
            borderTop: "1px solid var(--border-primary)",
            animation: "slideDown 0.2s ease-out",
          }}
        >
          {task.steps.length > 0 ? (
            task.steps.map((step) => <StepRow key={step.id} step={step} />)
          ) : (
            <p
              className="text-[11px] text-center py-4"
              style={{ color: "var(--text-muted)" }}
            >
              No steps yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Empty State ────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))",
            border: "1px solid rgba(99, 102, 241, 0.15)",
          }}
        >
          <Bot size={26} style={{ color: "var(--accent-primary)" }} />
        </div>
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          No active tasks
        </p>
        <p
          className="text-xs max-w-[180px] mx-auto leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Create a new task or start an AI coding session from chat
        </p>
      </div>
    </div>
  );
}

/* ── Main Panel ─────────────────────────────────── */
export default function AgentPanel() {
  const { tasks, createTask } = useAgentStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = () => {
    if (newTitle.trim()) {
      createTask(newTitle.trim());
      setNewTitle("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") {
      setIsCreating(false);
      setNewTitle("");
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: "36px",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            AI Agents
          </span>
          {tasks.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: "var(--accent-glow)",
                color: "var(--accent-primary)",
              }}
            >
              {tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all"
          style={{
            color: "var(--accent-primary)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Plus size={13} />
          New Task
        </button>
      </div>

      {/* New task input */}
      {isCreating && (
        <div
          className="px-3 py-2.5 shrink-0"
          style={{
            borderBottom: "1px solid var(--border-primary)",
            background: "var(--bg-tertiary)",
            animation: "slideDown 0.15s ease-out",
          }}
        >
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTitle.trim()) {
                setIsCreating(false);
              }
            }}
            placeholder="Describe the coding task..."
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-secondary)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCreate}
              className="flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all"
              style={{
                background: "var(--accent-primary)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Create Task
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTitle("");
              }}
              className="text-[11px] px-3 py-1.5 rounded-md font-medium transition-all"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 ? (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}</style>
    </div>
  );
}
