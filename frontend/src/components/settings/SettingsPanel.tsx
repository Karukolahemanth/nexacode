"use client";

import React, { useState } from "react";
import { Settings, Server, Monitor, Eye, RotateCcw, CheckCircle2, XCircle, Loader2, Palette, Code2 } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

function SettingGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span style={{ color: "var(--accent-primary)" }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</span>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-primary)" }}>
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{label}</div>
        {description && <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-2 py-1 rounded-md text-xs outline-none w-[180px]"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-8 h-[18px] rounded-full transition-all"
      style={{ background: checked ? "var(--accent-primary)" : "var(--bg-surface)", border: "1px solid var(--border-secondary)" }}
    >
      <div
        className="absolute top-[2px] w-3 h-3 rounded-full transition-all"
        style={{
          background: checked ? "white" : "var(--text-muted)",
          left: checked ? "14px" : "2px",
        }}
      />
    </button>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 rounded-md text-xs outline-none appearance-none cursor-pointer"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function SettingsPanel() {
  const settings = useSettingsStore();
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try {
      const resp = await fetch(`${settings.llmEndpoint}/api/tags`, { signal: AbortSignal.timeout(5000) });
      setTestStatus(resp.ok ? "success" : "error");
    } catch {
      // Try vLLM endpoint
      try {
        const resp = await fetch(`${settings.llmEndpoint}/models`, { signal: AbortSignal.timeout(5000) });
        setTestStatus(resp.ok ? "success" : "error");
      } catch {
        setTestStatus("error");
      }
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 shrink-0" style={{ height: "36px", minHeight: "36px", borderBottom: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2">
          <Settings size={13} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Settings</span>
        </div>
        <button
          onClick={settings.resetToDefaults}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Reset to defaults"
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* LLM Settings */}
        <SettingGroup title="LLM Backend" icon={<Server size={13} />}>
          <SettingRow label="Provider" description="Auto-detects vLLM or Ollama">
            <SelectInput
              value={settings.llmProvider}
              onChange={(v) => settings.setLlmProvider(v as "auto" | "vllm" | "ollama" | "demo")}
              options={[
                { value: "auto", label: "Auto Detect" },
                { value: "ollama", label: "Ollama" },
                { value: "vllm", label: "vLLM" },
                { value: "demo", label: "Demo Mode" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Endpoint URL" description="LLM server address">
            <TextInput value={settings.llmEndpoint} onChange={settings.setLlmEndpoint} placeholder="http://localhost:11434" />
          </SettingRow>
          <SettingRow label="Model" description="Model name or ID">
            <TextInput value={settings.llmModel} onChange={settings.setLlmModel} placeholder="qwen2.5-coder:7b" />
          </SettingRow>
          <SettingRow label="API Key" description="Optional, for vLLM">
            <TextInput value={settings.llmApiKey} onChange={settings.setLlmApiKey} placeholder="sk-..." type="password" />
          </SettingRow>
          <div className="px-3 py-2">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === "testing"}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50"
              style={{
                background: testStatus === "success" ? "rgba(52,211,153,0.15)" : testStatus === "error" ? "rgba(251,113,133,0.15)" : "var(--accent-glow)",
                color: testStatus === "success" ? "var(--accent-emerald)" : testStatus === "error" ? "var(--accent-rose)" : "var(--accent-primary-hover)",
                border: `1px solid ${testStatus === "success" ? "rgba(52,211,153,0.3)" : testStatus === "error" ? "rgba(251,113,133,0.3)" : "var(--border-accent)"}`,
              }}
            >
              {testStatus === "testing" && <Loader2 size={12} className="animate-spin-slow" />}
              {testStatus === "success" && <CheckCircle2 size={12} />}
              {testStatus === "error" && <XCircle size={12} />}
              {testStatus === "idle" && <Server size={12} />}
              {testStatus === "idle" ? "Test Connection" : testStatus === "testing" ? "Testing..." : testStatus === "success" ? "Connected!" : "Connection Failed"}
            </button>
          </div>
        </SettingGroup>

        {/* Editor Settings */}
        <SettingGroup title="Editor" icon={<Code2 size={13} />}>
          <SettingRow label="Font Size" description="Editor font size in pixels">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={24}
                value={settings.fontSize}
                onChange={(e) => settings.setFontSize(Number(e.target.value))}
                className="w-20 accent-[var(--accent-primary)]"
              />
              <span className="text-[10px] w-6 text-center" style={{ color: "var(--text-secondary)" }}>{settings.fontSize}</span>
            </div>
          </SettingRow>
          <SettingRow label="Tab Size">
            <SelectInput
              value={String(settings.tabSize)}
              onChange={(v) => settings.setTabSize(Number(v))}
              options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }]}
            />
          </SettingRow>
          <SettingRow label="Word Wrap">
            <Toggle checked={settings.wordWrap} onChange={settings.setWordWrap} />
          </SettingRow>
          <SettingRow label="Minimap">
            <Toggle checked={settings.minimap} onChange={settings.setMinimap} />
          </SettingRow>
        </SettingGroup>

        {/* Chat Settings */}
        <SettingGroup title="Chat" icon={<Palette size={13} />}>
          <SettingRow label="Show Timestamps">
            <Toggle checked={settings.showTimestamps} onChange={settings.setShowTimestamps} />
          </SettingRow>
          <SettingRow label="Compact Messages">
            <Toggle checked={settings.compactMessages} onChange={settings.setCompactMessages} />
          </SettingRow>
        </SettingGroup>
      </div>
    </div>
  );
}
