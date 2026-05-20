import { create } from "zustand";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  extension?: string;
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
}

// Demo file tree for Phase 1
const demoFileTree: FileNode[] = [
  {
    name: "nexus-ide",
    path: "/nexus-ide",
    type: "directory",
    children: [
      {
        name: "src",
        path: "/nexus-ide/src",
        type: "directory",
        children: [
          {
            name: "app",
            path: "/nexus-ide/src/app",
            type: "directory",
            children: [
              {
                name: "layout.tsx",
                path: "/nexus-ide/src/app/layout.tsx",
                type: "file",
                extension: "tsx",
                size: 1024,
              },
              {
                name: "page.tsx",
                path: "/nexus-ide/src/app/page.tsx",
                type: "file",
                extension: "tsx",
                size: 2048,
              },
              {
                name: "globals.css",
                path: "/nexus-ide/src/app/globals.css",
                type: "file",
                extension: "css",
                size: 4096,
              },
            ],
          },
          {
            name: "components",
            path: "/nexus-ide/src/components",
            type: "directory",
            children: [
              {
                name: "layout",
                path: "/nexus-ide/src/components/layout",
                type: "directory",
                children: [
                  {
                    name: "IDELayout.tsx",
                    path: "/nexus-ide/src/components/layout/IDELayout.tsx",
                    type: "file",
                    extension: "tsx",
                    size: 3200,
                  },
                  {
                    name: "Sidebar.tsx",
                    path: "/nexus-ide/src/components/layout/Sidebar.tsx",
                    type: "file",
                    extension: "tsx",
                    size: 2100,
                  },
                  {
                    name: "StatusBar.tsx",
                    path: "/nexus-ide/src/components/layout/StatusBar.tsx",
                    type: "file",
                    extension: "tsx",
                    size: 1400,
                  },
                ],
              },
              {
                name: "editor",
                path: "/nexus-ide/src/components/editor",
                type: "directory",
                children: [
                  {
                    name: "CodeEditor.tsx",
                    path: "/nexus-ide/src/components/editor/CodeEditor.tsx",
                    type: "file",
                    extension: "tsx",
                    size: 2800,
                  },
                  {
                    name: "EditorTabs.tsx",
                    path: "/nexus-ide/src/components/editor/EditorTabs.tsx",
                    type: "file",
                    extension: "tsx",
                    size: 1900,
                  },
                ],
              },
            ],
          },
          {
            name: "stores",
            path: "/nexus-ide/src/stores",
            type: "directory",
            children: [
              {
                name: "editorStore.ts",
                path: "/nexus-ide/src/stores/editorStore.ts",
                type: "file",
                extension: "ts",
                size: 1800,
              },
              {
                name: "fileStore.ts",
                path: "/nexus-ide/src/stores/fileStore.ts",
                type: "file",
                extension: "ts",
                size: 1200,
              },
            ],
          },
          {
            name: "lib",
            path: "/nexus-ide/src/lib",
            type: "directory",
            children: [
              {
                name: "utils.ts",
                path: "/nexus-ide/src/lib/utils.ts",
                type: "file",
                extension: "ts",
                size: 900,
              },
              {
                name: "socket.ts",
                path: "/nexus-ide/src/lib/socket.ts",
                type: "file",
                extension: "ts",
                size: 600,
              },
            ],
          },
        ],
      },
      {
        name: "package.json",
        path: "/nexus-ide/package.json",
        type: "file",
        extension: "json",
        size: 800,
      },
      {
        name: "tsconfig.json",
        path: "/nexus-ide/tsconfig.json",
        type: "file",
        extension: "json",
        size: 500,
      },
      {
        name: "next.config.ts",
        path: "/nexus-ide/next.config.ts",
        type: "file",
        extension: "ts",
        size: 300,
      },
      {
        name: "README.md",
        path: "/nexus-ide/README.md",
        type: "file",
        extension: "md",
        size: 2500,
      },
      {
        name: ".gitignore",
        path: "/nexus-ide/.gitignore",
        type: "file",
        extension: "gitignore",
        size: 200,
      },
    ],
  },
];

export const useFileStore = create<FileState>((set, get) => ({
  fileTree: demoFileTree,
  currentProject: "nexus-ide",
  expandedDirs: new Set<string>(["/nexus-ide", "/nexus-ide/src"]),
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
}));
