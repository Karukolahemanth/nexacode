import { create } from "zustand";

/* ── Types ──────────────────────────────────────── */

export type AgentTaskStatus =
  | "idle"
  | "planning"
  | "coding"
  | "debugging"
  | "reviewing"
  | "complete"
  | "error";

export type AgentStepType =
  | "thinking"
  | "tool_call"
  | "code_edit"
  | "file_read"
  | "terminal"
  | "review";

export type AgentStepStatus = "pending" | "running" | "done" | "error";

export interface AgentStep {
  id: string;
  type: AgentStepType;
  description: string;
  status: AgentStepStatus;
  result?: string;
  duration?: number; // milliseconds
}

export interface AgentTask {
  id: string;
  title: string;
  status: AgentTaskStatus;
  steps: AgentStep[];
  createdAt: number;
  completedAt?: number;
}

/* ── Store Interface ────────────────────────────── */

interface AgentState {
  tasks: AgentTask[];
  activeTaskId: string | null;

  // Actions
  createTask: (title: string) => string;
  updateTaskStatus: (taskId: string, status: AgentTaskStatus) => void;
  addStep: (taskId: string, step: Omit<AgentStep, "id">) => string;
  updateStep: (taskId: string, stepId: string, updates: Partial<AgentStep>) => void;
  setActiveTask: (taskId: string | null) => void;
  clearTasks: () => void;
  removeTask: (taskId: string) => void;
}

/* ── Demo Data ──────────────────────────────────── */

const DEMO_TASKS: AgentTask[] = [
  {
    id: "task-demo-1",
    title: "Refactor AuthProvider to use React Context",
    status: "complete",
    createdAt: Date.now() - 3600000,
    completedAt: Date.now() - 3540000,
    steps: [
      {
        id: "step-1a",
        type: "thinking",
        description: "Analyzing current AuthProvider implementation and dependencies",
        status: "done",
        duration: 2400,
        result: "Found 3 files using legacy prop-drilling pattern. Migration path identified.",
      },
      {
        id: "step-1b",
        type: "file_read",
        description: "Reading src/providers/AuthProvider.tsx",
        status: "done",
        duration: 340,
        result: "File loaded — 142 lines, uses useState + useEffect for auth state",
      },
      {
        id: "step-1c",
        type: "file_read",
        description: "Reading src/hooks/useAuth.ts",
        status: "done",
        duration: 280,
        result: "Custom hook wrapping prop-based auth — needs context migration",
      },
      {
        id: "step-1d",
        type: "code_edit",
        description: "Creating AuthContext with createContext + Provider pattern",
        status: "done",
        duration: 4800,
        result: "Created new context with typed value interface, added Provider wrapper",
      },
      {
        id: "step-1e",
        type: "code_edit",
        description: "Updating useAuth hook to consume context",
        status: "done",
        duration: 1200,
        result: "Replaced prop-based hook with useContext(AuthContext)",
      },
      {
        id: "step-1f",
        type: "terminal",
        description: "Running type-check: npx tsc --noEmit",
        status: "done",
        duration: 8200,
        result: "✓ No type errors found",
      },
      {
        id: "step-1g",
        type: "review",
        description: "Reviewing changes for correctness and best practices",
        status: "done",
        duration: 1600,
        result: "All changes verified. 3 files modified, 0 regressions.",
      },
    ],
  },
  {
    id: "task-demo-2",
    title: "Add rate limiting middleware to API routes",
    status: "coding",
    createdAt: Date.now() - 120000,
    steps: [
      {
        id: "step-2a",
        type: "thinking",
        description: "Planning rate limiting strategy — token bucket vs sliding window",
        status: "done",
        duration: 3100,
        result: "Sliding window approach selected for better burst handling. Will use Redis for distributed state.",
      },
      {
        id: "step-2b",
        type: "file_read",
        description: "Reading src/middleware/index.ts to understand middleware chain",
        status: "done",
        duration: 420,
        result: "Express-style middleware chain with error handler at end",
      },
      {
        id: "step-2c",
        type: "tool_call",
        description: "Searching codebase for existing rate limit patterns",
        status: "done",
        duration: 1800,
        result: "Found 0 existing rate limit implementations. Clean slate.",
      },
      {
        id: "step-2d",
        type: "code_edit",
        description: "Creating src/middleware/rateLimit.ts with sliding window algorithm",
        status: "running",
        duration: undefined,
      },
      {
        id: "step-2e",
        type: "terminal",
        description: "Installing dependency: npm install rate-limiter-flexible",
        status: "pending",
      },
      {
        id: "step-2f",
        type: "code_edit",
        description: "Integrating rate limiter into middleware chain",
        status: "pending",
      },
      {
        id: "step-2g",
        type: "review",
        description: "Final review and testing",
        status: "pending",
      },
    ],
  },
];

/* ── Store ──────────────────────────────────────── */

export const useAgentStore = create<AgentState>((set) => ({
  tasks: DEMO_TASKS,
  activeTaskId: "task-demo-2",

  createTask: (title: string) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTask: AgentTask = {
      id,
      title,
      status: "idle",
      steps: [],
      createdAt: Date.now(),
    };
    set((state) => ({
      tasks: [newTask, ...state.tasks],
      activeTaskId: id,
    }));
    return id;
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt:
                status === "complete" || status === "error"
                  ? Date.now()
                  : t.completedAt,
            }
          : t
      ),
    }));
  },

  addStep: (taskId, step) => {
    const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newStep: AgentStep = { ...step, id: stepId };
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, steps: [...t.steps, newStep] } : t
      ),
    }));
    return stepId;
  },

  updateStep: (taskId, stepId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: t.steps.map((s) =>
                s.id === stepId ? { ...s, ...updates } : s
              ),
            }
          : t
      ),
    }));
  },

  setActiveTask: (taskId) => set({ activeTaskId: taskId }),

  clearTasks: () => set({ tasks: [], activeTaskId: null }),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      activeTaskId:
        state.activeTaskId === taskId ? null : state.activeTaskId,
    })),
}));
