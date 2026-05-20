"use client";

import React, { useRef, useEffect, useState } from "react";
import { Sparkles, History, Plus, Wifi, WifiOff } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ModelSelector from "./ModelSelector";
import ThinkingIndicator from "./ThinkingIndicator";
import ConversationList from "./ConversationList";

export default function ChatPanel() {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const isConnected = useChatStore((s) => s.isConnected);
  const backendMode = useChatStore((s) => s.backendMode);
  const thinkingPhase = useChatStore((s) => s.thinkingPhase);
  const createConversation = useChatStore((s) => s.createConversation);

  const { sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showConversations, setShowConversations] = useState(false);

  // Get messages from the active conversation
  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingPhase]);

  const handleSend = (content: string, contextFiles?: string[]) => {
    sendMessage(content);
  };

  // Show conversation list view
  if (showConversations) {
    return <ConversationList onClose={() => setShowConversations(false)} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-secondary)" }}>
      {/* ── Header ─────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 shrink-0 select-none"
        style={{ height: "36px", minHeight: "36px", borderBottom: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            AI Chat
          </span>
          {/* Connection badge */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
            style={{
              background: isConnected
                ? "rgba(52,211,153,0.1)"
                : backendMode === "rest"
                ? "rgba(99,102,241,0.1)"
                : "rgba(251,113,133,0.1)",
              color: isConnected
                ? "var(--accent-emerald)"
                : backendMode === "rest"
                ? "var(--accent-primary)"
                : "var(--accent-rose)",
            }}
          >
            {isConnected ? <Wifi size={8} /> : <WifiOff size={8} />}
            {backendMode === "websocket" ? "Live" : "REST"}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Conversation history */}
          <button
            onClick={() => setShowConversations(true)}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            title="Conversation history"
          >
            <History size={13} />
          </button>
          {/* New chat */}
          <button
            onClick={createConversation}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            title="New chat"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* ── Model Selector Bar ─────────────────── */}
      <div
        className="flex items-center justify-between px-2 shrink-0"
        style={{ height: "30px", minHeight: "30px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-primary)" }}
      >
        <ModelSelector />
        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
          {messages.filter((m) => m.role === "user").length} messages
        </span>
      </div>

      {/* ── Messages ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Thinking indicator */}
        {isStreaming && thinkingPhase !== "idle" && (
          <ThinkingIndicator phase={thinkingPhase} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────── */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
