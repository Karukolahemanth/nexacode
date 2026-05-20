import { create } from "zustand";

export interface TerminalSession {
  id: string;
  name: string;
  isActive: boolean;
}

interface TerminalState {
  sessions: TerminalSession[];
  activeSessionId: string | null;

  // Actions
  createSession: (name?: string) => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: [{ id: "terminal-1", name: "bash", isActive: true }],
  activeSessionId: "terminal-1",

  createSession: (name) => {
    const id = `terminal-${Date.now()}`;
    const sessionName = name || `bash-${get().sessions.length + 1}`;
    set((state) => ({
      sessions: [
        ...state.sessions,
        { id, name: sessionName, isActive: true },
      ],
      activeSessionId: id,
    }));
    return id;
  },

  removeSession: (id) => {
    const { sessions, activeSessionId } = get();
    const newSessions = sessions.filter((s) => s.id !== id);

    let newActiveId = activeSessionId;
    if (activeSessionId === id) {
      newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
    }

    set({ sessions: newSessions, activeSessionId: newActiveId });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),
}));
