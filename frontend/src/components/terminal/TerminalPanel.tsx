"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const BACKEND_WS =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"
    : "ws://localhost:8000";

function generateSessionId() {
  return `term-${Math.random().toString(36).slice(2, 10)}`;
}

function TerminalCore() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionId = useRef(generateSessionId());

  useEffect(() => {
    let term: unknown;
    let fitAddon: unknown;
    let ws: WebSocket;

    const initTerminal = async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");
      await import("@xterm/xterm/css/xterm.css");

      if (!terminalRef.current) return;

      term = new Terminal({
        theme: {
          background: "#0a0e1a",
          foreground: "#e2e8f0",
          cursor: "#6366f1",
          cursorAccent: "#0a0e1a",
          selectionBackground: "#6366f133",
          selectionForeground: "#e2e8f0",
          black: "#0a0e1a",
          red: "#fb7185",
          green: "#34d399",
          yellow: "#fbbf24",
          blue: "#818cf8",
          magenta: "#c084fc",
          cyan: "#22d3ee",
          white: "#e2e8f0",
          brightBlack: "#475569",
          brightRed: "#fda4af",
          brightGreen: "#6ee7b7",
          brightYellow: "#fcd34d",
          brightBlue: "#a5b4fc",
          brightMagenta: "#d8b4fe",
          brightCyan: "#67e8f9",
          brightWhite: "#f1f5f9",
        },
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: "bar",
        allowTransparency: true,
        scrollback: 5000,
      });

      fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      (term as any).loadAddon(fitAddon);
      (term as any).loadAddon(webLinksAddon);
      (term as any).open(terminalRef.current);

      setTimeout(() => {
        try { (fitAddon as any).fit(); } catch { /* ignore */ }
      }, 100);

      xtermRef.current = term;

      // Connect to backend WebSocket terminal
      const wsUrl = `${BACKEND_WS}/ws/terminal/${sessionId.current}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        (term as any).writeln("\x1b[38;2;52;211;153m✓ Connected to NexusIDE Terminal\x1b[0m");
        (term as any).writeln("");
      };

      ws.onmessage = (event) => {
        (term as any).write(event.data);
      };

      ws.onerror = () => {
        (term as any).writeln("\r\n\x1b[38;2;251;113;133m⚠ Terminal connection failed. Backend may be offline.\x1b[0m\r\n");
      };

      ws.onclose = () => {
        (term as any).writeln("\r\n\x1b[38;2;148;163;184m[Terminal session ended]\x1b[0m\r\n");
      };

      // Forward keystrokes to backend
      (term as any).onData((data: string) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Resize observer
      const observer = new ResizeObserver(() => {
        try { (fitAddon as any).fit(); } catch { /* ignore */ }
      });
      observer.observe(terminalRef.current!);

      return () => {
        observer.disconnect();
        ws.close();
        (term as any).dispose();
      };
    };

    const cleanup = initTerminal();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full"
      style={{ background: "#0a0e1a" }}
    />
  );
}

const TerminalPanel = dynamic(
  () => Promise.resolve(TerminalCore),
  { ssr: false }
);

export default TerminalPanel;
