"use client";

import React from "react";
import { useFileStore, type FileNode } from "@/stores/fileStore";
import { useEditorStore } from "@/stores/editorStore";
import { getFileIcon, getFolderIcon } from "@/lib/fileIcons";
import { getFileExtension, getLanguageFromExtension } from "@/lib/utils";
import { ChevronRight, ChevronDown, RefreshCw, Plus, FolderPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Demo file contents for Phase 1
const demoContents: Record<string, string> = {
  "/nexus-ide/src/app/layout.tsx": `import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "NexusIDE — Private AI Coding Platform",
  description: "A production-grade, self-hosted AI coding platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.variable} \${jetbrainsMono.variable}\`}>
        {children}
      </body>
    </html>
  );
}`,
  "/nexus-ide/src/app/page.tsx": `"use client";

import IDELayout from "@/components/layout/IDELayout";

export default function Home() {
  return <IDELayout />;
}`,
  "/nexus-ide/src/app/globals.css": `@import "tailwindcss";

:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #0f1423;
  --accent-primary: #6366f1;
  --text-primary: #e2e8f0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }`,
  "/nexus-ide/package.json": `{
  "name": "nexus-ide",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "next": "15.x",
    "react": "^19.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^11.0.0",
    "xterm": "^5.3.0",
    "lucide-react": "^0.400.0",
    "socket.io-client": "^4.7.0"
  }
}`,
  "/nexus-ide/tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  }
}`,
  "/nexus-ide/README.md": `# NexusIDE

A production-grade, self-hosted AI coding platform.

## Features
- Monaco Editor with custom theme
- AI Chat Assistant
- Integrated Terminal
- File Explorer
- Git Integration
- Autonomous Coding Agents

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\``,
  "/nexus-ide/next.config.ts": `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;`,
  "/nexus-ide/.gitignore": `node_modules/
.next/
.env.local
*.log`,
};

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const { expandedDirs, toggleDir, selectedPath, setSelectedPath } = useFileStore();
  const { openFile } = useEditorStore();
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === "directory";

  const handleClick = () => {
    setSelectedPath(node.path);
    if (isDirectory) {
      toggleDir(node.path);
    } else {
      const ext = getFileExtension(node.name);
      const language = getLanguageFromExtension(ext);
      const content = demoContents[node.path] || `// ${node.name}\n`;
      openFile({
        path: node.path,
        name: node.name,
        language,
        content,
      });
    }
  };

  const { icon: FileIcon, color: iconColor } = isDirectory
    ? getFolderIcon(node.name, isExpanded)
    : getFileIcon(node.name);

  return (
    <div>
      <button
        onClick={handleClick}
        className="flex items-center w-full text-left group transition-colors duration-100"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          paddingRight: "8px",
          height: "26px",
          fontSize: "13px",
          color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
          background: isSelected ? "var(--bg-hover)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Expand/collapse chevron for directories */}
        {isDirectory ? (
          <span className="flex items-center justify-center w-4 h-4 mr-0.5 flex-shrink-0">
            {isExpanded ? (
              <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
            ) : (
              <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 mr-0.5 flex-shrink-0" />
        )}

        {/* Icon */}
        <FileIcon
          size={15}
          className="flex-shrink-0 mr-1.5"
          style={{ color: iconColor }}
        />

        {/* Name */}
        <span className="truncate">{node.name}</span>
      </button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isDirectory && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            {sortNodes(node.children).map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type === "directory" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });
}

export default function FileExplorer() {
  const { fileTree, currentProject } = useFileStore();

  return (
    <div
      className="h-full flex flex-col animate-fade-in"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 select-none"
        style={{
          height: "36px",
          minHeight: "36px",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            title="New File"
          >
            <Plus size={14} />
          </button>
          <button
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {fileTree.map((node) => (
          <FileTreeItem key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
