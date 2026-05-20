"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  FolderOpen,
  Palette,
  Keyboard,
  LogOut,
  ChevronUp,
  Moon,
  Sun,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

/* ── Avatar with gradient initials ─────────────────── */
function UserAvatar({
  username,
  size = 20,
}: {
  username: string;
  size?: number;
}) {
  const initials = username
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        color: "white",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );
}

/* ── Menu Items ────────────────────────────────────── */
interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  danger?: boolean;
  toggle?: boolean;
  toggleState?: boolean;
  onClick: () => void;
}

/* ── User Menu Component ───────────────────────────── */
export default function UserMenu() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!user) return null;

  const menuItems: MenuItem[] = [
    {
      id: "profile",
      icon: User,
      label: "Profile",
      shortcut: "⌘P",
      onClick: () => setIsOpen(false),
    },
    {
      id: "workspaces",
      icon: FolderOpen,
      label: "Workspaces",
      shortcut: "⌘W",
      onClick: () => setIsOpen(false),
    },
    {
      id: "theme",
      icon: isDarkTheme ? Moon : Sun,
      label: isDarkTheme ? "Dark Theme" : "Light Theme",
      toggle: true,
      toggleState: isDarkTheme,
      onClick: () => setIsDarkTheme(!isDarkTheme),
    },
    {
      id: "shortcuts",
      icon: Keyboard,
      label: "Keyboard Shortcuts",
      shortcut: "⌘K",
      onClick: () => setIsOpen(false),
    },
    {
      id: "signout",
      icon: LogOut,
      label: "Sign Out",
      danger: true,
      onClick: () => {
        setIsOpen(false);
        logout();
      },
    },
  ];

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 opacity-90 hover:opacity-100"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          padding: "0 2px",
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
        title={`Signed in as ${user.username}`}
      >
        <UserAvatar username={user.username} size={16} />
        <span>{user.username}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp size={10} />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              width: 220,
              borderRadius: 12,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-secondary)",
              boxShadow:
                "0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.06)",
              overflow: "hidden",
              zIndex: 1000,
            }}
          >
            {/* User info header */}
            <div
              className="flex items-center gap-3 p-3"
              style={{
                borderBottom: "1px solid var(--border-primary)",
              }}
            >
              <UserAvatar username={user.username} size={32} />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.username}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: 4 }}>
              {menuItems.map((item, idx) => {
                const isSignOut = item.id === "signout";
                return (
                  <React.Fragment key={item.id}>
                    {isSignOut && (
                      <div
                        style={{
                          height: 1,
                          background: "var(--border-primary)",
                          margin: "4px 8px",
                        }}
                      />
                    )}
                    <motion.button
                      whileHover={{ x: 2 }}
                      onClick={item.onClick}
                      className="flex items-center w-full"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: item.danger
                          ? "var(--accent-rose)"
                          : "var(--text-secondary)",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.15s",
                        fontFamily: "var(--font-sans)",
                        width: "100%",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = item.danger
                          ? "rgba(251,113,133,0.08)"
                          : "var(--bg-hover)";
                        e.currentTarget.style.color = item.danger
                          ? "var(--accent-rose)"
                          : "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = item.danger
                          ? "var(--accent-rose)"
                          : "var(--text-secondary)";
                      }}
                    >
                      <item.icon size={15} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.shortcut && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {item.shortcut}
                        </span>
                      )}
                      {item.toggle && (
                        <div
                          style={{
                            width: 28,
                            height: 16,
                            borderRadius: 8,
                            background: item.toggleState
                              ? "var(--accent-primary)"
                              : "var(--bg-surface)",
                            position: "relative",
                            transition: "background 0.2s",
                          }}
                        >
                          <motion.div
                            animate={{ x: item.toggleState ? 13 : 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: "white",
                              position: "absolute",
                              top: 2,
                            }}
                          />
                        </div>
                      )}
                    </motion.button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Version footer */}
            <div
              style={{
                padding: "6px 14px 8px",
                borderTop: "1px solid var(--border-primary)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                NexusIDE v1.0.0 • {user.role}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
