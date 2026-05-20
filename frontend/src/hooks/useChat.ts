"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/stores/chatStore";

const BACKEND_WS = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useChat() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const store = useChatStore;

  const connect = useCallback(() => {
    const sessionId = store.getState().sessionId;
    const url = `${BACKEND_WS}/ws/chat/${sessionId}`;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        store.getState().setConnected(true);
        store.getState().setBackendMode("websocket");
        reconnectAttempts.current = 0;
        console.log("[NexusChat] WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.error("[NexusChat] Parse error:", e);
        }
      };

      ws.onclose = () => {
        store.getState().setConnected(false);
        wsRef.current = null;
        console.log("[NexusChat] WebSocket closed — falling back to REST");

        // Try REST fallback instead of demo mode
        store.getState().setBackendMode("rest");

        // Attempt reconnect with backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000);
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(() => {
            console.log(`[NexusChat] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Will trigger onclose, which handles fallback
        console.warn("[NexusChat] WebSocket error — will fall back to REST");
      };

      wsRef.current = ws;
    } catch {
      store.getState().setBackendMode("rest");
      console.warn("[NexusChat] WebSocket unavailable — using REST fallback");
    }
  }, []);

  const handleMessage = useCallback((msg: { type: string; data: any }) => {
    const state = store.getState();

    switch (msg.type) {
      case "message_ack":
        break;

      case "stream_start":
        state.setStreaming(true);
        state.setThinkingPhase("generating");
        state.updateStreamingMessage(msg.data.id, "");
        break;

      case "stream_token":
        state.setThinkingPhase("idle"); // got first token, no longer "thinking"
        state.updateStreamingMessage(msg.data.id, msg.data.token);
        break;

      case "stream_end":
        state.finalizeStreamingMessage(msg.data.id, msg.data.content);
        break;

      case "rag_context":
        state.setThinkingPhase("searching");
        // Store RAG sources on the last streaming message
        if (msg.data.sources) {
          const messages = state.conversations.find(
            (c) => c.id === state.activeConversationId
          )?.messages;
          const lastStreamingMsg = messages?.findLast((m) => m.isStreaming);
          if (lastStreamingMsg) {
            state.setMessageRagSources(lastStreamingMsg.id, msg.data.sources);
          }
        }
        break;

      case "thinking":
        state.setThinkingPhase(msg.data.phase || "thinking");
        break;

      case "tool_call":
        state.setThinkingPhase("tool_calling");
        break;

      case "pong":
        break;

      default:
        console.log("[NexusChat] Unknown message type:", msg.type);
    }
  }, []);

  /**
   * REST/SSE fallback: POST to /api/chat and stream the response.
   */
  const sendViaRest = useCallback(async (content: string) => {
    const state = store.getState();
    const msgId = `rest-${Date.now()}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          model: state.selectedModel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && response.body) {
        // SSE streaming response
        store.getState().setThinkingPhase("generating");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                // Stream complete
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) {
                  store.getState().setThinkingPhase("idle");
                  store.getState().updateStreamingMessage(msgId, parsed.token);
                } else if (parsed.content) {
                  store.getState().finalizeStreamingMessage(msgId, parsed.content);
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (parseErr) {
                // If it's not JSON, treat the raw data as a token
                if (data && data !== "[DONE]") {
                  store.getState().updateStreamingMessage(msgId, data);
                }
              }
            }
          }
        }

        // Finalize if not already done
        const conv = store.getState().conversations.find(
          (c) => c.id === store.getState().activeConversationId
        );
        const streamingMsg = conv?.messages.find((m) => m.id === msgId);
        if (streamingMsg?.isStreaming) {
          store.getState().finalizeStreamingMessage(msgId, streamingMsg.content);
        }
      } else {
        // JSON response (non-streaming)
        const data = await response.json();
        store.getState().setThinkingPhase("idle");
        store.getState().updateStreamingMessage(msgId, "");
        store.getState().finalizeStreamingMessage(
          msgId,
          data.content || data.message || JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error("[NexusChat] REST fallback error:", error);
      store.getState().setBackendMode("rest");
      store.getState().updateStreamingMessage(msgId, "");
      store.getState().finalizeStreamingMessage(
        msgId,
        "⚠️ Cannot connect to server. Please check the backend is running."
      );
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    const state = store.getState();

    // Add user message
    state.addMessage({ role: "user", content });
    state.setStreaming(true);
    state.setThinkingPhase("thinking");

    if (state.backendMode === "websocket" && wsRef.current?.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        type: "chat_message",
        content,
        model: state.selectedModel,
      }));
    } else {
      // REST fallback
      sendViaRest(content);
    }
  }, [sendViaRest]);

  // Try to connect on mount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { sendMessage };
}
