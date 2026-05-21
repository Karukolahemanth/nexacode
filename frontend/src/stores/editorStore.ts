import { create } from "zustand";

export interface FileTab {
  id: string;
  path: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  isPreview: boolean;
}

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    : "http://localhost:8000";

interface EditorState {
  tabs: FileTab[];
  activeTabId: string | null;
  isSaving: boolean;

  // Actions
  openFile: (file: Omit<FileTab, "id" | "isDirty" | "isPreview">) => void;
  fetchAndOpenFile: (path: string, name: string) => Promise<void>;
  saveFile: (tabId?: string) => Promise<void>;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

function generateTabId(path: string): string {
  return `tab-${path.replace(/[^a-zA-Z0-9]/g, "-")}`;
}

function getLanguageFromExt(filename: string): string {
  const ext = filename.split(".").pop() || "";
  const map: Record<string, string> = {
    py: "python", ts: "typescript", tsx: "typescript",
    js: "javascript", jsx: "javascript", json: "json",
    md: "markdown", css: "css", html: "html",
    sh: "shell", yaml: "yaml", yml: "yaml",
    toml: "toml", txt: "plaintext", rs: "rust",
    go: "go", java: "java", cpp: "cpp", c: "c",
  };
  return map[ext] || "plaintext";
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isSaving: false,

  openFile: (file) => {
    const id = generateTabId(file.path);
    const { tabs } = get();
    const existing = tabs.find((t) => t.id === id);

    if (existing) {
      set({ activeTabId: id });
      return;
    }

    const newTab: FileTab = {
      ...file,
      id,
      isDirty: false,
      isPreview: false,
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: id,
    });
  },

  fetchAndOpenFile: async (path, name) => {
    const id = generateTabId(path);
    const { tabs } = get();
    // If already open, just activate
    const existing = tabs.find((t) => t.id === id);
    if (existing) {
      set({ activeTabId: id });
      return;
    }

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/files/read?path=${encodeURIComponent(path)}`
      );
      if (!res.ok) throw new Error(`Failed to read file: ${res.status}`);
      const data = await res.json();

      const newTab: FileTab = {
        id,
        path,
        name,
        language: data.language || getLanguageFromExt(name),
        content: data.content || "",
        isDirty: false,
        isPreview: false,
      };

      set({
        tabs: [...get().tabs, newTab],
        activeTabId: id,
      });
    } catch (err) {
      console.error("[EditorStore] fetchAndOpenFile error:", err);
    }
  },

  saveFile: async (tabId) => {
    const { tabs, activeTabId } = get();
    const id = tabId || activeTabId;
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    set({ isSaving: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/files/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: tab.path, content: tab.content }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, isDirty: false } : t
        ),
        isSaving: false,
      }));
    } catch (err) {
      console.error("[EditorStore] saveFile error:", err);
      set({ isSaving: false });
    }
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);

    let newActiveId = activeTabId;
    if (activeTabId === id) {
      if (newTabs.length === 0) {
        newActiveId = null;
      } else if (index >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id;
      } else {
        newActiveId = newTabs[index].id;
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateContent: (id, content) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    }));
  },

  markSaved: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, isDirty: false } : t
      ),
    }));
  },

  closeAllTabs: () => set({ tabs: [], activeTabId: null }),

  closeOtherTabs: (id) => {
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id === id),
      activeTabId: id,
    }));
  },

  reorderTabs: (fromIndex, toIndex) => {
    set((state) => {
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return { tabs: newTabs };
    });
  },
}));
