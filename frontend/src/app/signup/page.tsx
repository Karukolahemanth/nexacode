"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

/* ── Animated background (shared design with login) ── */
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
      {[
        { x: "25%", y: "15%", color: "rgba(139,92,246,0.15)", size: 550, delay: 0 },
        { x: "75%", y: "25%", color: "rgba(99,102,241,0.12)", size: 600, delay: 2 },
        { x: "50%", y: "75%", color: "rgba(34,211,238,0.07)", size: 700, delay: 4 },
        { x: "15%", y: "70%", color: "rgba(139,92,246,0.06)", size: 400, delay: 1 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, 25, -15, 0],
            y: [0, -30, 25, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 22 + i * 3,
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

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

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

/* ── Password strength helper ──────────────────────── */
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Weak", color: "var(--accent-rose)" };
  if (score <= 3) return { level: 2, label: "Medium", color: "var(--accent-amber)" };
  return { level: 3, label: "Strong", color: "var(--accent-emerald)" };
}

/* ── Input Component ───────────────────────────────── */
function FormInput({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  delay = 0,
  showToggle,
  showPassword,
  onToggle,
}: {
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  delay?: number;
  showToggle?: boolean;
  showPassword?: boolean;
  onToggle?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
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
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon
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
          type={showToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: showToggle ? "10px 40px 10px 40px" : "10px 12px 10px 40px",
            borderRadius: 10,
            background: "var(--bg-tertiary)",
            border: `1px solid ${error ? "var(--accent-rose)" : "var(--border-primary)"}`,
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            fontFamily: "var(--font-sans)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-primary)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--accent-rose)"
              : "var(--border-primary)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
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
        )}
      </div>
      {error && (
        <p style={{ fontSize: 11, color: "var(--accent-rose)", marginTop: 4 }}>
          {error}
        </p>
      )}
    </motion.div>
  );
}

/* ── Main Signup Page ──────────────────────────────── */
export default function SignupPage() {
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = "Username is required";
    else if (username.length < 3) errs.username = "Username must be at least 3 characters";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (!acceptTerms) errs.terms = "You must accept the terms";
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    await signup(username, email, password);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
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

      {/* Signup card */}
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
        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15), rgba(34,211,238,0.1))",
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
            border: "1px solid rgba(139,92,246,0.15)",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
            padding: "36px 36px 32px",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15)",
                marginBottom: 12,
              }}
            >
              <Sparkles size={28} color="white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Create Account
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginTop: 4,
              }}
            >
              Start building with NexusIDE
            </motion.p>
          </div>

          {/* Global error */}
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
                  marginBottom: 14,
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <FormInput
              label="Username"
              icon={User}
              value={username}
              onChange={(v) => {
                setUsername(v);
                setLocalErrors((p) => ({ ...p, username: "" }));
              }}
              placeholder="nexus_dev"
              error={localErrors.username}
              delay={0.45}
            />

            <FormInput
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setLocalErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="developer@example.com"
              error={localErrors.email}
              delay={0.5}
            />

            <FormInput
              label="Password"
              icon={Lock}
              value={password}
              onChange={(v) => {
                setPassword(v);
                setLocalErrors((p) => ({ ...p, password: "" }));
              }}
              placeholder="••••••••"
              error={localErrors.password}
              delay={0.55}
              showToggle
              showPassword={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />

            {/* Password strength bar */}
            <AnimatePresence>
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: -4 }}
                >
                  <div
                    className="flex items-center gap-2"
                    style={{ marginBottom: 4 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: "var(--bg-surface)",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(strength.level / 3) * 100}%`,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          background: strength.color,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: strength.color,
                        fontWeight: 500,
                        minWidth: 50,
                      }}
                    >
                      {strength.label}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FormInput
              label="Confirm Password"
              icon={Shield}
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                setLocalErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              placeholder="••••••••"
              error={localErrors.confirmPassword}
              delay={0.6}
              showToggle
              showPassword={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />

            {/* Terms checkbox */}
            <motion.label
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex items-start gap-2 cursor-pointer"
              style={{ marginTop: 4 }}
            >
              <div
                onClick={() => {
                  setAcceptTerms(!acceptTerms);
                  setLocalErrors((p) => ({ ...p, terms: "" }));
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: `1px solid ${localErrors.terms ? "var(--accent-rose)" : acceptTerms ? "var(--accent-primary)" : "var(--border-secondary)"}`,
                  background: acceptTerms
                    ? "var(--accent-primary)"
                    : "var(--bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                {acceptTerms && <Check size={12} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                I agree to the{" "}
                <span style={{ color: "var(--accent-primary)", cursor: "pointer" }}>
                  Terms of Service
                </span>{" "}
                and{" "}
                <span style={{ color: "var(--accent-primary)", cursor: "pointer" }}>
                  Privacy Policy
                </span>
              </span>
            </motion.label>
            {localErrors.terms && (
              <p style={{ fontSize: 11, color: "var(--accent-rose)", marginTop: -4 }}>
                {localErrors.terms}
              </p>
            )}

            {/* Create Account button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(139,92,246,0.3)" }}
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
                boxShadow: "0 4px 15px rgba(139,92,246,0.25)",
                fontFamily: "var(--font-sans)",
                transition: "opacity 0.2s",
                marginTop: 4,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin-slow" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign in link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "var(--text-tertiary)",
            }}
          >
            Already have an account?{" "}
            <a
              href="/login"
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
              Sign in
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
