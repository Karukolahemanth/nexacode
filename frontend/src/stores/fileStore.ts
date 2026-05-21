import { create } from "zustand";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  extension?: string;
}

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    : "http://localhost:8000";

function addExtension(node: FileNode): FileNode {
  if (node.type === "file") {
    const ext = node.name.split(".").pop() || "";
    return { ...node, extension: ext };
  }
  return {
    ...node,
    children: node.children?.map(addExtension),
  };
}

interface FileState {
  fileTree: FileNode[];
  currentProject: string | null;
  expandedDirs: Set<string>;
  selectedPath: string | null;
  isLoading: boolean;

  // Actions
  setFileTree: (tree: FileNode[]) => void;
  setCurrentProject: (project: string) => void;
  toggleDir: (path: string) => void;
  expandDir: (path: string) => void;
  collapseDir: (path: string) => void;
  setSelectedPath: (path: string | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Real API actions
  fetchFileTree: () => Promise<void>;
  addFile: (parentPath: string, name: string) => Promise<void>;
  addFolder: (parentPath: string, name: string) => Promise<void>;
  deleteNode: (path: string) => Promise<void>;
  renameNode: (oldPath: string, newName: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  fileTree: [],
  currentProject: "workspace",
  expandedDirs: new Set<string>(["/"]),
  selectedPath: null,
  isLoading: false,

  setFileTree: (tree) => set({ fileTree: tree }),
  setCurrentProject: (project) => set({ currentProject: project }),

  toggleDir: (path) => {
    set((state) => {
      const newExpanded = new Set(state.expandedDirs);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedDirs: newExpanded };
    });
  },

  expandDir: (path) => {
    set((state) => {
      const newExpanded = new Set(state.expandedDirs);
      newExpanded.add(path);
      return { expandedDirs: newExpanded };
    });
  },

  collapseDir: (path) => {
    set((state) => {
      const newExpanded = new Set(state.expandedDirs);
      newExpanded.delete(path);
      return { expandedDirs: newExpanded };
    });
  },

  setSelectedPath: (path) => set({ selectedPath: path }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  fetchFileTree: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/files/list?path=/`);
      if (!res.ok) throw new Error(`Failed to fetch file tree: ${res.status}`);
      const data = await res.json();
      const children: FileNode[] = (data.children || []).map(addExtension);
      set({ fileTree: children, isLoading: false });
    } catch (err) {
      console.error("[FileStore] fetchFileTree error:", err);
      set({ isLoading: false });
    }
  },

  addFile: async (parentPath, name) => {
    const filePath = parentPath ? `${parentPath}/${name}` : `/${name}`;
    try {
      await fetch(`${BACKEND_URL}/api/files/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content: "" }),
      });
      await get().fetchFileTree();
    } catch (err) {
      console.error("[FileStore] addFile error:", err);
    }
  },

  addFolder: async (parentPath, name) => {
    const folderPath = parentPath ? `${parentPath}/${name}` : `/${name}`;
    try {
      await fetch(`${BACKEND_URL}/api/files/mkdir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath }),
      });
      await get().fetchFileTree();
    } catch (err) {
      console.error("[FileStore] addFolder error:", err);
    }
  },

  deleteNode: async (path) => {
    try {
      await fetch(
        `${BACKEND_URL}/api/files/delete?path=${encodeURIComponent(path)}`,
        { method: "DELETE" }
      );
      await get().fetchFileTree();
    } catch (err) {
      console.error("[FileStore] deleteNode error:", err);
    }
  },

  renameNode: async (oldPath, newName) => {
    // Build new path from parent
    const parts = oldPath.split("/");
    parts[parts.length - 1] = newName;
    const newPath = parts.join("/");
    try {
      await fetch(`${BACKEND_URL}/api/files/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: oldPath, destination: newPath }),
      });
      await get().fetchFileTree();
    } catch (err) {
      console.error("[FileStore] renameNode error:", err);
    }
  },
}));
