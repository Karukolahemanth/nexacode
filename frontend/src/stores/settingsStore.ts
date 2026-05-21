import { create } from "zustand";

interface SettingsState {
  // LLM
  llmEndpoint: string;
  llmModel: string;
  llmApiKey: string;
  llmProvider: "auto" | "vllm" | "ollama";

  // Editor
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;

  // UI
  showTimestamps: boolean;
  compactMessages: boolean;

  // Actions
  setLlmEndpoint: (url: string) => void;
  setLlmModel: (model: string) => void;
  setLlmApiKey: (key: string) => void;
  setLlmProvider: (provider: "auto" | "vllm" | "ollama") => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setMinimap: (show: boolean) => void;
  setShowTimestamps: (show: boolean) => void;
  setCompactMessages: (compact: boolean) => void;
  resetToDefaults: () => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(`nexus-${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`nexus-${key}`, JSON.stringify(value));
  } catch { /* ignore */ }
}

const DEFAULTS = {
  llmEndpoint: "https://api.groq.com/openai/v1",
  llmModel: "qwen-qwq-32b",
  llmApiKey: "",
  llmProvider: "auto" as const,
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  showTimestamps: true,
  compactMessages: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  llmEndpoint: loadFromStorage("llmEndpoint", DEFAULTS.llmEndpoint),
  llmModel: loadFromStorage("llmModel", DEFAULTS.llmModel),
  llmApiKey: loadFromStorage("llmApiKey", DEFAULTS.llmApiKey),
  llmProvider: loadFromStorage("llmProvider", DEFAULTS.llmProvider),
  fontSize: loadFromStorage("fontSize", DEFAULTS.fontSize),
  tabSize: loadFromStorage("tabSize", DEFAULTS.tabSize),
  wordWrap: loadFromStorage("wordWrap", DEFAULTS.wordWrap),
  minimap: loadFromStorage("minimap", DEFAULTS.minimap),
  showTimestamps: loadFromStorage("showTimestamps", DEFAULTS.showTimestamps),
  compactMessages: loadFromStorage("compactMessages", DEFAULTS.compactMessages),

  setLlmEndpoint: (url) => { saveToStorage("llmEndpoint", url); set({ llmEndpoint: url }); },
  setLlmModel: (model) => { saveToStorage("llmModel", model); set({ llmModel: model }); },
  setLlmApiKey: (key) => { saveToStorage("llmApiKey", key); set({ llmApiKey: key }); },
  setLlmProvider: (provider) => { saveToStorage("llmProvider", provider); set({ llmProvider: provider }); },
  setFontSize: (size) => { saveToStorage("fontSize", size); set({ fontSize: size }); },
  setTabSize: (size) => { saveToStorage("tabSize", size); set({ tabSize: size }); },
  setWordWrap: (wrap) => { saveToStorage("wordWrap", wrap); set({ wordWrap: wrap }); },
  setMinimap: (show) => { saveToStorage("minimap", show); set({ minimap: show }); },
  setShowTimestamps: (show) => { saveToStorage("showTimestamps", show); set({ showTimestamps: show }); },
  setCompactMessages: (compact) => { saveToStorage("compactMessages", compact); set({ compactMessages: compact }); },

  resetToDefaults: () => {
    Object.entries(DEFAULTS).forEach(([key, value]) => saveToStorage(key, value));
    set(DEFAULTS);
  },
}));
