"use client";

import { create } from "zustand";

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    : "http://localhost:8000";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "admin" | "user";
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nexus-auth-token");
}

function saveAuth(token: string, user: User) {
  localStorage.setItem("nexus-auth-token", token);
  localStorage.setItem("nexus-auth-user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("nexus-auth-token");
  localStorage.removeItem("nexus-auth-user");
  localStorage.removeItem("nexus-refresh-token");
}

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("nexus-auth-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadUser(),
  isAuthenticated: !!loadToken(),
  isLoading: false,
  token: loadToken(),
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Login failed (${res.status})`);
      }

      const data = await res.json();
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role || "user",
        createdAt: data.user.createdAt || new Date().toISOString(),
      };

      saveAuth(data.access_token, user);
      if (data.refresh_token) {
        localStorage.setItem("nexus-refresh-token", data.refresh_token);
      }

      set({ user, isAuthenticated: true, token: data.access_token, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
    }
  },

  signup: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Signup failed (${res.status})`);
      }

      const data = await res.json();
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role || "user",
        createdAt: data.user.createdAt || new Date().toISOString(),
      };

      saveAuth(data.access_token, user);
      if (data.refresh_token) {
        localStorage.setItem("nexus-refresh-token", data.refresh_token);
      }

      set({ user, isAuthenticated: true, token: data.access_token, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Signup failed", isLoading: false });
    }
  },

  logout: () => {
    clearAuth();
    set({ user: null, isAuthenticated: false, token: null, error: null });
  },

  checkAuth: async () => {
    const token = loadToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        clearAuth();
        set({ isAuthenticated: false, user: null, token: null });
        return;
      }

      const data = await res.json();
      const user: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role || "user",
        createdAt: data.createdAt || new Date().toISOString(),
      };

      set({ user, isAuthenticated: true, token });
    } catch {
      // Backend unreachable — keep cached user
      const cached = loadUser();
      if (cached) {
        set({ user: cached, isAuthenticated: true, token });
      }
    }
  },

  loginAsDemo: async () => {
    // Try real login with demo credentials, fall back to local
    set({ isLoading: true, error: null });
    try {
      await get().login("demo", "demo123");
    } catch {
      // If backend is down, create a local demo session
      const demoUser: User = {
        id: "demo-user",
        username: "demo",
        email: "demo@nexuside.dev",
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      saveAuth("demo-token", demoUser);
      set({ user: demoUser, isAuthenticated: true, token: "demo-token", isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
