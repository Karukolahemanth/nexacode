import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolCalls?: Array<{ name: string; args: string; result?: string }>;
  isStreaming?: boolean;
  ragSources?: Array<{ file: string; startLine: number; endLine: number; score: number }>;
  contextFiles?: string[];
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model?: string;
}

export type ThinkingPhase = "idle" | "thinking" | "searching" | "generating" | "tool_calling";

interface ChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string;

  // Current state
  isStreaming: boolean;
  inputValue: string;
  sessionId: string;
  isConnected: boolean;
  backendMode: "websocket" | "rest";
  thinkingPhase: ThinkingPhase;
  selectedModel: string;

  // Computed
  messages: ChatMessage[];

  // Actions
  setInputValue: (value: string) => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateStreamingMessage: (id: string, token: string) => void;
  finalizeStreamingMessage: (id: string, content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setConnected: (connected: boolean) => void;
  setBackendMode: (mode: "websocket" | "rest") => void;
  setThinkingPhase: (phase: ThinkingPhase) => void;
  setSelectedModel: (model: string) => void;
  clearMessages: () => void;

  // Conversation management
  createConversation: () => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;

  // RAG
  setMessageRagSources: (msgId: string, sources: ChatMessage["ragSources"]) => void;
}

const WELCOME_MSG: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to **NexusIDE**! I'm your AI coding assistant powered by **Qwen3-35B**.\n\nI can help you:\n- ✨ **Write** code and components\n- 🐛 **Debug** errors\n- 🔄 **Refactor** code\n- 📖 **Explain** patterns\n\nType a message below to get started.",
  timestamp: Date.now(),
};

function createNewConversation(): Conversation {
  const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    title: "New Chat",
    messages: [WELCOME_MSG],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const initialConversation = createNewConversation();

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [initialConversation],
  activeConversationId: initialConversation.id,
  isStreaming: false,
  inputValue: "",
  sessionId: `session-${Date.now()}`,
  isConnected: false,
  backendMode: "rest",
  thinkingPhase: "idle",
  selectedModel: "Qwen/Qwen3-35B-A3B",

  get messages() {
    const state = get();
    const conv = state.conversations.find((c) => c.id === state.activeConversationId);
    return conv?.messages ?? [];
  },

  setInputValue: (value) => set({ inputValue: value }),

  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newMsg: ChatMessage = { ...msg, id, timestamp: Date.now() };

    set((state) => {
      const convs = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        const updated = {
          ...c,
          messages: [...c.messages, newMsg],
          updatedAt: Date.now(),
        };
        // Auto-title from first user message
        if (msg.role === "user" && c.title === "New Chat") {
          updated.title = msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : "");
        }
        return updated;
      });
      return { conversations: convs };
    });
  },

  updateStreamingMessage: (id, token) => {
    set((state) => {
      const convs = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        const msgs = [...c.messages];
        const idx = msgs.findIndex((m) => m.id === id);
        if (idx !== -1) {
          msgs[idx] = { ...msgs[idx], content: msgs[idx].content + token };
        } else {
          msgs.push({ id, role: "assistant", content: token, isStreaming: true, timestamp: Date.now() });
        }
        return { ...c, messages: msgs, updatedAt: Date.now() };
      });
      return { conversations: convs };
    });
  },

  finalizeStreamingMessage: (id, content) => {
    set((state) => {
      const convs = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        const msgs = c.messages.map((m) =>
          m.id === id ? { ...m, content, isStreaming: false } : m
        );
        return { ...c, messages: msgs, updatedAt: Date.now() };
      });
      return { conversations: convs, isStreaming: false, thinkingPhase: "idle" };
    });
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setConnected: (connected) => set({ isConnected: connected }),
  setBackendMode: (mode) => set({ backendMode: mode }),
  setThinkingPhase: (phase) => set({ thinkingPhase: phase }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  clearMessages: () => {
    set((state) => {
      const convs = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        return { ...c, messages: [WELCOME_MSG], updatedAt: Date.now(), title: "New Chat" };
      });
      return { conversations: convs, isStreaming: false, thinkingPhase: "idle" };
    });
  },

  createConversation: () => {
    const conv = createNewConversation();
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: conv.id,
      isStreaming: false,
      thinkingPhase: "idle",
      inputValue: "",
    }));
    return conv.id;
  },

  switchConversation: (id) => {
    set({ activeConversationId: id, isStreaming: false, thinkingPhase: "idle", inputValue: "" });
  },

  deleteConversation: (id) => {
    set((state) => {
      let convs = state.conversations.filter((c) => c.id !== id);
      if (convs.length === 0) {
        const newConv = createNewConversation();
        convs = [newConv];
      }
      const activeId = state.activeConversationId === id ? convs[0].id : state.activeConversationId;
      return { conversations: convs, activeConversationId: activeId };
    });
  },

  renameConversation: (id, title) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    }));
  },

  setMessageRagSources: (msgId, sources) => {
    set((state) => {
      const convs = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        const msgs = c.messages.map((m) =>
          m.id === msgId ? { ...m, ragSources: sources } : m
        );
        return { ...c, messages: msgs };
      });
      return { conversations: convs };
    });
  },
}));
