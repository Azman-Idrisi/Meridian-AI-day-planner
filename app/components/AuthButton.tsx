"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setShowMenu(false);
  }

  if (loading)
    return <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />;

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs text-white/50 hover:text-white/70"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M13.3 7.15c0-.5-.04-1-.13-1.48H7v2.8h3.53a3.02 3.02 0 01-1.31 1.98v1.64h2.12c1.24-1.14 1.96-2.82 1.96-4.94z"
            fill="#4285F4"
          />
          <path
            d="M7 13.5c1.77 0 3.25-.58 4.34-1.58l-2.12-1.64c-.59.4-1.34.63-2.22.63-1.7 0-3.15-1.15-3.67-2.7H1.15v1.7A6.5 6.5 0 007 13.5z"
            fill="#34A853"
          />
          <path
            d="M3.33 8.21A3.9 3.9 0 013.1 7c0-.42.07-.83.2-1.21V4.09H1.15A6.5 6.5 0 00.5 7c0 1.05.25 2.04.65 2.91l2.18-1.7z"
            fill="#FBBC05"
          />
          <path
            d="M7 3.08c.96 0 1.82.33 2.5.97l1.87-1.87A6.47 6.47 0 007 .5 6.5 6.5 0 001.15 4.1l2.18 1.7C3.85 4.23 5.3 3.08 7 3.08z"
            fill="#EA4335"
          />
        </svg>
        Sign in
      </button>
    );
  }

  const name = user.user_metadata?.full_name ?? user.email ?? "User";
  const avatar = user.user_metadata?.avatar_url;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-150"
      >
        {/* Avatar */}
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-6 h-6 rounded-full ring-1 ring-white/10"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium text-white/60">
            {initials}
          </div>
        )}

        {/* Name */}
        <span className="text-xs text-white/50 max-w-[100px] truncate hidden sm:block">
          {name.split(" ")[0]}
        </span>

        {/* Chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`text-white/20 transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
        >
          <path
            d="M2 3.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#111] shadow-xl z-20 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-xs font-medium text-white/70 truncate">
                {name}
              </p>
              <p className="text-[11px] text-white/30 truncate mt-0.5">
                {user.email}
              </p>
            </div>

            {/* Sign out */}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-white/40 hover:text-red-400/70 hover:bg-white/[0.03] transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4.5 2H2.5A1 1 0 001.5 3v6a1 1 0 001 1h2M8 8.5l2.5-2.5L8 3.5M10.5 6h-6"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
