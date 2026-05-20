"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, MessageSquare, Trash2, MoreHorizontal, ChevronLeft, Pencil, Check, X } from "lucide-react";
import { useChatStore, type Conversation } from "@/stores/chatStore";

function ConversationItem({
  conv,
  isActive,
  onSwitch,
  onDelete,
  onRename,
}: {
  conv: Conversation;
  isActive: boolean;
  onSwitch: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const msgCount = conv.messages.filter((m) => m.role !== "system" && m.id !== "welcome").length;
  const timeAgo = getTimeAgo(conv.updatedAt);

  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
      style={{
        background: isActive ? "var(--bg-hover)" : "transparent",
        borderLeft: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
      }}
      onClick={onSwitch}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <MessageSquare size={13} style={{ color: isActive ? "var(--accent-primary)" : "var(--text-muted)", flexShrink: 0 }} />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setIsEditing(false); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent outline-none text-xs px-1 py-0.5 rounded"
              style={{ color: "var(--text-primary)", border: "1px solid var(--accent-primary)" }}
            />
            <button onClick={(e) => { e.stopPropagation(); handleRename(); }} className="p-0.5"><Check size={11} style={{ color: "var(--accent-emerald)" }} /></button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="p-0.5"><X size={11} style={{ color: "var(--text-muted)" }} /></button>
          </div>
        ) : (
          <>
            <div className="text-xs font-medium truncate" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
              {conv.title}
            </div>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
              <span>{msgCount} msgs</span>
              <span>·</span>
              <span>{timeAgo}</span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditTitle(conv.title); setIsEditing(true); }}
            className="p-1 rounded hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
            title="Rename"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConversationList({ onClose }: { onClose: () => void }) {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const createConversation = useChatStore((s) => s.createConversation);
  const switchConversation = useChatStore((s) => s.switchConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-secondary)", animation: "slideInLeft 0.15s ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 shrink-0" style={{ height: "36px", borderBottom: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--text-tertiary)" }}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Conversations
          </span>
        </div>
        <button
          onClick={() => { createConversation(); onClose(); }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:bg-white/5"
          style={{ color: "var(--accent-primary-hover)" }}
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conv={conv}
            isActive={conv.id === activeConversationId}
            onSwitch={() => { switchConversation(conv.id); onClose(); }}
            onDelete={() => deleteConversation(conv.id)}
            onRename={(title) => renameConversation(conv.id, title)}
          />
        ))}
      </div>
    </div>
  );
}
