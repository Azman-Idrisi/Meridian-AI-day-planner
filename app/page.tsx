"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskInput, { ScheduleBlock } from "./components/TaskInput";
import ScheduleView from "./components/ScheduleView";
import AuthButton from "./components/AuthButton";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

interface HistoryEntry {
  id: string;
  date: string;
  title: string;
  tasks: string;
  schedule: ScheduleBlock[];
}

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [mobileTab, setMobileTab] = useState<"plan" | "history">("plan");
  const [user, setUser] = useState<User | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setUser(session?.user ?? null);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load history from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setDbLoading(false);
      return;
    }
    setDbLoading(true);
    supabase
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data)
          setHistory(
            data.map((row) => ({
              id: row.id,
              date: row.date,
              title: row.title,
              tasks: row.tasks,
              schedule: row.schedule,
            })),
          );
        setDbLoading(false);
      });
  }, [user]);

  async function handleSchedule(newSchedule: ScheduleBlock[]) {
    setSchedule(newSchedule);

    const firstTask = newSchedule.find(
      (b) =>
        !b.task.toLowerCase().includes("break") &&
        !b.task.toLowerCase().includes("lunch") &&
        !b.task.toLowerCase().includes("planning"),
    );

    const title = firstTask
      ? firstTask.task.length > 28
        ? firstTask.task.slice(0, 28) + "…"
        : firstTask.task
      : "Untitled session";

    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      title,
      tasks: `${newSchedule.length} blocks · ${(newSchedule.reduce((a, b) => a + (parseInt(b.duration) || 0), 0) / 60).toFixed(1)}h`,
      schedule: newSchedule,
    };

    // Save to Supabase if logged in
    if (user) {
      const { data } = await supabase
        .from("schedules")
        .insert({
          user_id: user.id,
          title: entry.title,
          date: entry.date,
          tasks: entry.tasks,
          schedule: newSchedule,
        })
        .select()
        .single();

      if (data) entry.id = data.id;
    }

    setHistory((prev) => [entry, ...prev].slice(0, 10));
    setMobileTab("plan");
  }

  async function handleDelete(id: string) {
    if (user) await supabase.from("schedules").delete().eq("id", id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  }

  function handleReset() {
    setSchedule([]);
    setSelectedEntry(null);
  }

  const viewingSchedule =
    selectedEntry?.schedule ?? (schedule.length > 0 ? schedule : null);

  const HistoryPanel = () => (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-1">
          History
        </h2>
        <p className="text-xs text-white/20">
          {!user
            ? "Sign in to save schedules across devices"
            : "Your past schedules"}
        </p>
      </div>

      {/* Not signed in */}
      {!user && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16">
          <div className="w-10 h-10 rounded-xl border border-white/[0.08] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="2"
                y="7"
                width="12"
                height="8"
                rx="2"
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="1.2"
              />
              <path
                d="M5 7V5a3 3 0 016 0v2"
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-xs text-white/20 text-center leading-relaxed">
            Sign in with Google to save
            <br />
            your schedules across devices.
          </p>
          <AuthButton />
        </div>
      )}

      {/* Loading */}
      {user && dbLoading && (
        <div className="flex items-center justify-center flex-1">
          <div className="w-4 h-4 border border-white/20 border-t-white/50 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {user && !dbLoading && history.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <p className="text-xs text-white/20 text-center leading-relaxed">
            No schedules yet.
            <br />
            Plan your first day!
          </p>
        </div>
      )}

      {/* History list */}
      {user && !dbLoading && history.length > 0 && (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {history.map((entry, i) => (
            <div key={entry.id} className="relative group/card">
              <button
                onClick={() => {
                  setSelectedEntry(entry);
                  setSchedule([]);
                  setMobileTab("plan");
                }}
                className={`
                  w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150
                  ${
                    selectedEntry?.id === entry.id
                      ? "border-white/20 bg-white/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono text-white/20 mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/70 leading-snug truncate">
                        {entry.title}
                      </p>
                      <p className="text-[11px] text-white/25 font-mono mt-0.5">
                        {entry.date} · {entry.tasks}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex gap-0.5 items-end h-4">
                      {entry.schedule.slice(0, 4).map((_, j) => (
                        <div
                          key={j}
                          className="w-1 rounded-sm"
                          style={{
                            height: `${[8, 14, 10, 12][j % 4]}px`,
                            background: [
                              "#4ade8033",
                              "#60a5fa33",
                              "#f59e0b33",
                              "#a78bfa33",
                            ][j % 4],
                          }}
                        />
                      ))}
                    </div>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      className="text-white/20"
                    >
                      <path
                        d="M3 2l4 3-4 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-2.5 pl-6 flex flex-wrap gap-1">
                  {entry.schedule.slice(0, 2).map((block, j) => (
                    <span
                      key={j}
                      className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md truncate max-w-[110px]"
                    >
                      {block.task}
                    </span>
                  ))}
                  {entry.schedule.length > 2 && (
                    <span className="text-[10px] text-white/20">
                      +{entry.schedule.length - 2} more
                    </span>
                  )}
                </div>
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(entry.id)}
                className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity text-white/20 hover:text-red-400/60 p-1"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 2l6 6M8 2L2 8"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PlanPanel = () => (
    <div className="h-full flex flex-col justify-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-5 h-5 border border-white/20 border-t-white/70 rounded-full animate-spin" />
          <p className="text-xs text-white/30 font-mono">
            building your schedule...
          </p>
        </div>
      ) : viewingSchedule ? (
        <ScheduleView schedule={viewingSchedule} onReset={handleReset} />
      ) : (
        <TaskInput onSchedule={handleSchedule} onLoading={setLoading} />
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* ── DESKTOP ── */}
      <div className="hidden md:flex flex-col min-h-screen">
        {/* Top nav */}
        <div className="flex items-center justify-between px-10 lg:px-14 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  stroke="white"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                />
                <path
                  d="M7 4.5v2.8l1.8 1"
                  stroke="white"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/40 tracking-wide">
              Meridian
            </span>
          </div>
          <AuthButton />
        </div>

        {/* Two col */}
        <div className="flex flex-1">
          <div className="w-1/2 border-r  border-white/[0.06] px-10 lg:px-14 py-14 flex flex-col justify-center">
            <PlanPanel />
          </div>
          <div className="w-1/2 px-10 lg:px-14 py-14 flex flex-col overflow-hidden">
            <HistoryPanel />
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile nav */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  stroke="white"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                />
                <path
                  d="M7 4.5v2.8l1.8 1"
                  stroke="white"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/40">focusly</span>
          </div>
          <AuthButton />
        </div>

        {/* Tab switcher */}
        <div className="flex px-5 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="flex bg-white/[0.04] rounded-xl p-1 gap-1 w-full">
            {(["plan", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`
                  flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200
                  ${mobileTab === tab ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50"}
                `}
              >
                {tab === "plan"
                  ? "Plan"
                  : `History${history.length > 0 ? ` (${history.length})` : ""}`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {mobileTab === "plan" ? (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <PlanPanel />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
