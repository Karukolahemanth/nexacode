"use client";

import React from "react";
import { Sparkles, Code2, Terminal, Bot, GitBranch, FileCode } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Code2,
    title: "Smart Editor",
    desc: "Monaco-powered editor with intelligent code completion",
    color: "#6366f1",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    desc: "Chat with AI to write, debug, and refactor code",
    color: "#8b5cf6",
  },
  {
    icon: Terminal,
    title: "Integrated Terminal",
    desc: "Full terminal access in sandboxed Docker workspaces",
    color: "#22d3ee",
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    desc: "Built-in source control with diff previews",
    color: "#34d399",
  },
  {
    icon: FileCode,
    title: "Autonomous Agents",
    desc: "AI agents that plan, code, debug, and review",
    color: "#fbbf24",
  },
];

export default function WelcomeTab() {
  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{ background: "var(--bg-secondary)" }}
    >
      <motion.div
        className="flex flex-col items-center max-w-lg text-center px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            boxShadow: "0 0 40px rgba(99, 102, 241, 0.3)",
          }}
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Sparkles size={36} className="text-white" />
        </motion.div>

        {/* Title */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Welcome to NexusIDE
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          Your private AI-powered coding platform
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-3 w-full">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{
                background: "var(--bg-hover)",
                borderColor: "var(--border-secondary)",
                x: 4,
              }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                style={{
                  background: `${feat.color}15`,
                  color: feat.color,
                }}
              >
                <feat.icon size={18} />
              </div>
              <div className="text-left">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feat.title}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {feat.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Keyboard shortcut hint */}
        <motion.p
          className="text-xs mt-6"
          style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Open a file from the explorer or press{" "}
          <kbd
            className="px-1.5 py-0.5 rounded text-xs"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
              color: "var(--text-secondary)",
            }}
          >
            Ctrl+P
          </kbd>{" "}
          to search
        </motion.p>
      </motion.div>
    </div>
  );
}
