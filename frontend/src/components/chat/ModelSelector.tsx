"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, Wifi, WifiOff, Zap, Cloud, Monitor } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
}

const MODELS: ModelOption[] = [
  { id: "qwen2.5-coder:7b", name: "Qwen 2.5 Coder 7B", provider: "Ollama", description: "Fast, efficient coding model", icon: <Zap size={13} style={{ color: "var(--accent-emerald)" }} /> },
  { id: "qwen2.5-coder:14b", name: "Qwen 2.5 Coder 14B", provider: "Ollama", description: "Balanced quality and speed", icon: <Zap size={13} style={{ color: "var(--accent-cyan)" }} /> },
  { id: "qwen2.5-coder:32b", name: "Qwen 2.5 Coder 32B", provider: "Ollama", description: "Best quality, requires more RAM", icon: <Zap size={13} style={{ color: "var(--accent-primary)" }} /> },
  { id: "deepseek-coder-v2:16b", name: "DeepSeek Coder V2 16B", provider: "Ollama", description: "Strong coding performance", icon: <Cpu size={13} style={{ color: "var(--accent-amber)" }} /> },
  { id: "codellama:13b", name: "Code Llama 13B", provider: "Ollama", description: "Meta's coding model", icon: <Cpu size={13} style={{ color: "var(--accent-rose)" }} /> },
  { id: "Qwen/Qwen2.5-Coder-32B-Instruct", name: "Qwen 2.5 Coder 32B", provider: "vLLM", description: "Production-grade via vLLM", icon: <Cloud size={13} style={{ color: "var(--accent-primary)" }} /> },
  { id: "demo", name: "Demo Mode", provider: "Local", description: "Simulated responses, no GPU needed", icon: <Monitor size={13} style={{ color: "var(--text-tertiary)" }} /> },
];

export default function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = useChatStore((s) => s.selectedModel);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const isConnected = useChatStore((s) => s.isConnected);
  const backendMode = useChatStore((s) => s.backendMode);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all hover:bg-white/5"
        style={{
          color: "var(--text-secondary)",
          background: isOpen ? "var(--bg-hover)" : "transparent",
        }}
      >
        {currentModel.icon}
        <span className="max-w-[100px] truncate">{currentModel.name}</span>
        <ChevronDown size={11} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-[280px] rounded-lg overflow-hidden z-50"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-secondary)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5), var(--shadow-glow)",
            animation: "slideInUp 0.12s ease-out",
          }}
        >
          {/* Connection status */}
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--border-primary)" }}>
            <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`} />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {isConnected ? `Connected — ${backendMode}` : "Offline — Demo mode"}
            </span>
          </div>

          {/* Models */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                className="flex items-start gap-2.5 w-full px-3 py-2 text-left transition-colors"
                style={{
                  background: model.id === selectedModel ? "var(--bg-hover)" : "transparent",
                }}
                onClick={() => {
                  setSelectedModel(model.id);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = model.id === selectedModel ? "var(--bg-hover)" : "transparent"; }}
              >
                <span className="mt-0.5 flex-shrink-0">{model.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{model.name}</span>
                    <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                      {model.provider}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{model.description}</span>
                </div>
                {model.id === selectedModel && (
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent-primary)" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
