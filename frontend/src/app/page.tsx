"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import IDELayout from "@/components/layout/IDELayout";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      await checkAuth();
      setChecking(false);
    };
    verify();
  }, []);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.replace("/login");
    }
  }, [checking, isAuthenticated, router]);

  // Show nothing while checking auth (avoid flash of IDE)
  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 3L4 14h7l-1 8 9-11h-7l1-8z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="white"
            />
          </svg>
        </div>
        <p style={{ color: "var(--text-tertiary)", fontSize: 13, fontFamily: "var(--font-sans)" }}>
          Loading NexusCode...
        </p>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect happening)
  if (!isAuthenticated) {
    return null;
  }

  return <IDELayout />;
}
