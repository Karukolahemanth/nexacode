"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

/* ── Animated background orbs ──────────────────────── */
function BackgroundMesh() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        background: "var(--bg-primary)",
      }}
    >
      {/* Gradient mesh orbs */}
      {[
        { x: "20%", y: "20%", color: "rgba(99,102,241,0.15)", size: 600, delay: 0 },
        { x: "80%", y: "30%", color: "rgba(139,92,246,0.12)", size: 500, delay: 2 },
        { x: "50%", y: "70%", color: "rgba(34,211,238,0.08)", size: 700, delay: 4 },
        { x: "10%", y: "80%", color: "rgba(99,102,241,0.06)", size: 400, delay: 1 },
        { x: "90%", y: "80%", color: "rgba(139,92,246,0.08)", size: 450, delay: 3 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 20 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
          style={{
            position: "absolute",
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
            filter: "blur(40px)",
          }}
        />
      ))}

      {/* Grid lines overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(10,14,26,0.4) 70%, rgba(10,14,26,0.8) 100%)",
        }}
      />
    </div>
  );
}

/* ── Floating particles ────────────────────────────── */
function FloatingParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "var(--accent-primary)",
            boxShadow: `0 0 ${p.size * 3}px rgba(99,102,241,0.3)`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Main Login Page ───────────────────────────────── */
export default function LoginPage() {
  const { login, loginAsDemo, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState<{ username?: string; password?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to IDE if already logged in
  useEffect(() => {
    if (mounted && isAuthenticated) {
      window.location.href = "/";
    }
  }, [mounted, isAuthenticated]);

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) errs.username = "Username or email is required";
    if (!password.trim()) errs.password = "Password is required";
    else if (password.length < 3) errs.password = "Password is too short";
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    await login(username, password);
    if (useAuthStore.getState().isAuthenticated) {
      window.location.href = "/";
    }
  };

  const handleDemo = async () => {
    await loginAsDemo();
    window.location.href = "/";
  };

  if (!mounted) return null;


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "var(--font-sans)",
      }}
    >
      <BackgroundMesh />
      <FloatingParticles />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 420,
          margin: "0 16px",
        }}
      >
        {/* Outer glow */}
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15), rgba(34,211,238,0.1))",
            filter: "blur(1px)",
          }}
        />

        <div
          style={{
            position: "relative",
            borderRadius: 20,
            background: "rgba(15,20,35,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(99,102,241,0.15)",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
            padding: "40px 36px 36px",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)",
                marginBottom: 16,
              }}
            >
              <Sparkles size={32} color="white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              NexusIDE
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              style={{
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginTop: 4,
              }}
            >
              Sign in to your workspace
            </motion.p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(251,113,133,0.1)",
                  border: "1px solid rgba(251,113,133,0.2)",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "var(--accent-rose)",
                }}
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username / Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Username or Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLocalErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  placeholder="developer@nexuside.io"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 40px",
                    borderRadius: 10,
                    background: "var(--bg-tertiary)",
                    border: `1px solid ${localErrors.username ? "var(--accent-rose)" : "var(--border-primary)"}`,
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    fontFamily: "var(--font-sans)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(99,102,241,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = localErrors.username
                      ? "var(--accent-rose)"
                      : "var(--border-primary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              {localErrors.username && (
                <p style={{ fontSize: 11, color: "var(--accent-rose)", marginTop: 4 }}>
                  {localErrors.username}
                </p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 40px",
                    borderRadius: 10,
                    background: "var(--bg-tertiary)",
                    border: `1px solid ${localErrors.password ? "var(--accent-rose)" : "var(--border-primary)"}`,
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    fontFamily: "var(--font-sans)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(99,102,241,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = localErrors.password
                      ? "var(--accent-rose)"
                      : "var(--border-primary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {localErrors.password && (
                <p style={{ fontSize: 11, color: "var(--accent-rose)", marginTop: 4 }}>
                  {localErrors.password}
                </p>
              )}
            </motion.div>

            {/* Forgot password link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Forgot password?
              </button>
            </motion.div>

            {/* Sign In button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: isLoading ? 0.7 : 1,
                boxShadow: "0 4px 15px rgba(99,102,241,0.25)",
                fontFamily: "var(--font-sans)",
                transition: "opacity 0.2s",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin-slow" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3 my-5"
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--border-primary)",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--border-primary)",
              }}
            />
          </motion.div>

          {/* Demo Mode button */}
          <motion.button
            onClick={handleDemo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            whileHover={{
              scale: 1.01,
              background: "rgba(34,211,238,0.1)",
            }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              background: "rgba(34,211,238,0.06)",
              color: "var(--accent-cyan)",
              fontWeight: 500,
              fontSize: 14,
              border: "1px solid rgba(34,211,238,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--font-sans)",
              transition: "all 0.2s",
            }}
          >
            <Zap size={16} />
            Continue in Demo Mode
          </motion.button>

          {/* Sign Up link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "var(--text-tertiary)",
            }}
          >
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              style={{
                color: "var(--accent-primary)",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-primary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--accent-primary)")
              }
            >
              Sign up
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
