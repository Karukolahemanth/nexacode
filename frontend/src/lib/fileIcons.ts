import {
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileCog,
  FileType,
  Folder,
  FolderOpen,
  FolderGit,
  File,
  Database,
  Globe,
  Terminal,
  Lock,
  Braces,
  Hash,
  Code,
  Palette,
  Settings,
  Package,
  type LucideIcon,
} from "lucide-react";

type IconMapping = {
  icon: LucideIcon;
  color: string;
};

const extensionIcons: Record<string, IconMapping> = {
  // TypeScript/JavaScript
  ts: { icon: FileCode, color: "#3178c6" },
  tsx: { icon: FileCode, color: "#3178c6" },
  js: { icon: FileCode, color: "#f7df1e" },
  jsx: { icon: FileCode, color: "#61dafb" },
  mjs: { icon: FileCode, color: "#f7df1e" },
  cjs: { icon: FileCode, color: "#f7df1e" },

  // Python
  py: { icon: FileCode, color: "#3776ab" },
  pyx: { icon: FileCode, color: "#3776ab" },
  pyi: { icon: FileCode, color: "#3776ab" },

  // Web
  html: { icon: Globe, color: "#e34f26" },
  css: { icon: Palette, color: "#1572b6" },
  scss: { icon: Palette, color: "#cc6699" },
  less: { icon: Palette, color: "#1d365d" },
  svg: { icon: FileImage, color: "#ffb13b" },

  // Data
  json: { icon: Braces, color: "#292929" },
  yaml: { icon: FileText, color: "#cb171e" },
  yml: { icon: FileText, color: "#cb171e" },
  xml: { icon: FileText, color: "#e37933" },
  toml: { icon: FileText, color: "#9c4121" },
  csv: { icon: Database, color: "#22863a" },

  // Config
  env: { icon: Lock, color: "#ecd53f" },
  gitignore: { icon: Settings, color: "#f05032" },
  dockerignore: { icon: Settings, color: "#2496ed" },
  editorconfig: { icon: Settings, color: "#e0efef" },
  eslintrc: { icon: Settings, color: "#4b32c3" },
  prettierrc: { icon: Settings, color: "#f7b93e" },

  // Markdown
  md: { icon: FileText, color: "#083fa1" },
  mdx: { icon: FileText, color: "#fcb32c" },

  // Shell
  sh: { icon: Terminal, color: "#4eaa25" },
  bash: { icon: Terminal, color: "#4eaa25" },
  zsh: { icon: Terminal, color: "#4eaa25" },
  ps1: { icon: Terminal, color: "#012456" },

  // Build/Package
  dockerfile: { icon: Package, color: "#2496ed" },
  "docker-compose": { icon: Package, color: "#2496ed" },

  // Images
  png: { icon: FileImage, color: "#a074c4" },
  jpg: { icon: FileImage, color: "#a074c4" },
  jpeg: { icon: FileImage, color: "#a074c4" },
  gif: { icon: FileImage, color: "#a074c4" },
  webp: { icon: FileImage, color: "#a074c4" },
  ico: { icon: FileImage, color: "#a074c4" },

  // Rust
  rs: { icon: FileCode, color: "#dea584" },

  // Go
  go: { icon: FileCode, color: "#00add8" },

  // Java/Kotlin
  java: { icon: FileCode, color: "#b07219" },
  kt: { icon: FileCode, color: "#a97bff" },

  // C/C++
  c: { icon: FileCode, color: "#555555" },
  cpp: { icon: FileCode, color: "#f34b7d" },
  h: { icon: FileCode, color: "#555555" },
  hpp: { icon: FileCode, color: "#f34b7d" },

  // Other
  sql: { icon: Database, color: "#e38c00" },
  graphql: { icon: Code, color: "#e10098" },
  proto: { icon: FileType, color: "#4285f4" },
  lock: { icon: Lock, color: "#9b9b9b" },
};

const filenameIcons: Record<string, IconMapping> = {
  "package.json": { icon: Package, color: "#cb3837" },
  "tsconfig.json": { icon: FileCog, color: "#3178c6" },
  "next.config.ts": { icon: FileCog, color: "#000000" },
  "next.config.js": { icon: FileCog, color: "#000000" },
  "tailwind.config.ts": { icon: FileCog, color: "#06b6d4" },
  "tailwind.config.js": { icon: FileCog, color: "#06b6d4" },
  ".gitignore": { icon: Settings, color: "#f05032" },
  ".env": { icon: Lock, color: "#ecd53f" },
  ".env.local": { icon: Lock, color: "#ecd53f" },
  ".env.example": { icon: Lock, color: "#ecd53f" },
  "Dockerfile": { icon: Package, color: "#2496ed" },
  "docker-compose.yml": { icon: Package, color: "#2496ed" },
  "requirements.txt": { icon: Hash, color: "#3776ab" },
  "Cargo.toml": { icon: Package, color: "#dea584" },
  "go.mod": { icon: Package, color: "#00add8" },
  "Makefile": { icon: FileCog, color: "#427819" },
  "README.md": { icon: FileText, color: "#083fa1" },
  "LICENSE": { icon: FileText, color: "#9b9b9b" },
};

export function getFileIcon(filename: string): IconMapping {
  // Check exact filename first
  const lowerFilename = filename.toLowerCase();
  if (filenameIcons[filename]) return filenameIcons[filename];

  // Check extension
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (extensionIcons[ext]) return extensionIcons[ext];

  // Default
  return { icon: File, color: "#9b9b9b" };
}

export function getFolderIcon(
  name: string,
  isOpen: boolean
): { icon: LucideIcon; color: string } {
  if (name === ".git" || name === "git") {
    return { icon: FolderGit, color: "#f05032" };
  }

  return {
    icon: isOpen ? FolderOpen : Folder,
    color: isOpen ? "#dcb67a" : "#c09553",
  };
}
