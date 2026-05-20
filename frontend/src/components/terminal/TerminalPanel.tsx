"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// We need to dynamically import xterm since it requires DOM
function TerminalCore() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<unknown>(null);

  useEffect(() => {
    let term: unknown;
    let fitAddon: unknown;

    const initTerminal = async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // Import xterm CSS
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

      // Fit to container
      setTimeout(() => {
        try {
          (fitAddon as any).fit();
        } catch { /* ignore */ }
      }, 100);

      // Write welcome message
      (term as any).writeln("\x1b[38;2;99;102;241m╔══════════════════════════════════════════╗\x1b[0m");
      (term as any).writeln("\x1b[38;2;99;102;241m║\x1b[0m  \x1b[1;38;2;226;232;240m⚡ NexusIDE Terminal\x1b[0m                     \x1b[38;2;99;102;241m║\x1b[0m");
      (term as any).writeln("\x1b[38;2;99;102;241m║\x1b[0m  \x1b[38;2;148;163;184mSecure Docker Workspace\x1b[0m                \x1b[38;2;99;102;241m║\x1b[0m");
      (term as any).writeln("\x1b[38;2;99;102;241m╚══════════════════════════════════════════╝\x1b[0m");
      (term as any).writeln("");
      (term as any).write("\x1b[38;2;52;211;153m❯\x1b[0m ");

      // Handle input (demo mode - echo back)
      let currentLine = "";
      (term as any).onData((data: string) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          (term as any).writeln("");
          if (currentLine.trim()) {
            handleCommand(term, currentLine.trim());
          }
          currentLine = "";
          (term as any).write("\x1b[38;2;52;211;153m❯\x1b[0m ");
        } else if (code === 127) {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            (term as any).write("\b \b");
          }
        } else if (code >= 32) {
          // Printable chars
          currentLine += data;
          (term as any).write(data);
        }
      });

      xtermRef.current = term;

      // Resize observer
      const observer = new ResizeObserver(() => {
        try {
          (fitAddon as any).fit();
        } catch { /* ignore */ }
      });
      observer.observe(terminalRef.current);

      return () => {
        observer.disconnect();
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

function handleCommand(term: any, cmd: string) {
  const commands: Record<string, () => void> = {
    help: () => {
      term.writeln("\x1b[1;38;2;129;140;248mAvailable commands:\x1b[0m");
      term.writeln("  \x1b[38;2;226;232;240mhelp\x1b[0m        Show this help message");
      term.writeln("  \x1b[38;2;226;232;240mclear\x1b[0m       Clear the terminal");
      term.writeln("  \x1b[38;2;226;232;240mwhoami\x1b[0m      Show current user");
      term.writeln("  \x1b[38;2;226;232;240mdate\x1b[0m        Show current date");
      term.writeln("  \x1b[38;2;226;232;240mecho\x1b[0m        Echo text");
      term.writeln("  \x1b[38;2;226;232;240mnexus\x1b[0m       Show NexusIDE info");
      term.writeln("");
      term.writeln("  \x1b[38;2;148;163;184mNote: Full terminal requires Docker backend\x1b[0m");
    },
    clear: () => {
      term.clear();
    },
    whoami: () => {
      term.writeln("\x1b[38;2;226;232;240mnexus-user\x1b[0m");
    },
    date: () => {
      term.writeln(`\x1b[38;2;226;232;240m${new Date().toString()}\x1b[0m`);
    },
    nexus: () => {
      term.writeln("\x1b[1;38;2;99;102;241m⚡ NexusIDE v1.0.0\x1b[0m");
      term.writeln("\x1b[38;2;148;163;184mPrivate AI Coding Platform\x1b[0m");
      term.writeln("\x1b[38;2;148;163;184mPowered by Qwen2.5-Coder-32B\x1b[0m");
    },
    ls: () => {
      term.writeln("\x1b[38;2;129;140;248msrc/\x1b[0m  \x1b[38;2;129;140;248mpublic/\x1b[0m  \x1b[38;2;129;140;248mnode_modules/\x1b[0m");
      term.writeln("\x1b[38;2;226;232;240mpackage.json\x1b[0m  \x1b[38;2;226;232;240mtsconfig.json\x1b[0m  \x1b[38;2;226;232;240mREADME.md\x1b[0m");
    },
    pwd: () => {
      term.writeln("\x1b[38;2;226;232;240m/workspace/nexus-ide\x1b[0m");
    },
  };

  const parts = cmd.split(" ");
  const command = parts[0].toLowerCase();

  if (command === "echo") {
    term.writeln(`\x1b[38;2;226;232;240m${parts.slice(1).join(" ")}\x1b[0m`);
  } else if (commands[command]) {
    commands[command]();
  } else {
    term.writeln(
      `\x1b[38;2;251;113;133mbash: ${command}: command not found\x1b[0m`
    );
    term.writeln(
      `\x1b[38;2;148;163;184mTip: Type 'help' for available commands\x1b[0m`
    );
  }
}

// Dynamically import to avoid SSR
const TerminalPanel = dynamic(
  () => Promise.resolve(TerminalCore),
  { ssr: false }
);

export default TerminalPanel;
