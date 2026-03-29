"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TaskInputProps {
  onSchedule: (schedule: ScheduleBlock[]) => void;
  onLoading: (loading: boolean) => void;
}

export interface ScheduleBlock {
  time: string;
  duration: string;
  task: string;
  reason: string;
}

const timeOptions = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"];
const endTimeOptions = ["4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];
const energyOptions = ["Low", "Medium", "High"];

export default function TaskInput({ onSchedule, onLoading }: TaskInputProps) {
  const [tasks, setTasks] = useState("");
  const [startTime, setStartTime] = useState("9:00 AM");
  const [endTime, setEndTime] = useState("6:00 PM");
  const [energy, setEnergy] = useState("Medium");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!tasks.trim()) {
      setError("Add at least one task.");
      return;
    }
    setError("");
    onLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, startTime, endTime, energy }),
      });
      const data = await res.json();
      if (data.error) setError("Something went wrong. Try again.");
      else onSchedule(data.schedule);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      onLoading(false);
    }
  }

  const selectClass = `
    w-full px-3 py-2.5 text-sm rounded-lg border border-white/10
    bg-white/5 text-white/80
    focus:outline-none focus:border-white/30
    transition-colors appearance-none cursor-pointer
    font-['DM_Sans']
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white tracking-tight mb-2">
          What's on your plate
          <br />
          today?
        </h1>
        <p className="text-sm text-white/30">
          Drop your tasks — AI handles the rest.
        </p>
      </div>

      {/* Textarea */}
      <div className="mb-4">
        <textarea
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          placeholder={"- Review PR\n- Write report\n- Fix bug\n- Team standup"}
          rows={6}
          className="
            w-full px-4 py-3.5 text-sm rounded-xl border border-white/10
            bg-white/5 text-white/80 placeholder:text-white/20
            focus:outline-none focus:border-white/25 focus:bg-white/[0.07]
            transition-all resize-none leading-relaxed
            font-['DM_Mono']
          "
        />
      </div>

      {/* Options row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          {
            label: "Start",
            value: startTime,
            setter: setStartTime,
            options: timeOptions,
          },
          {
            label: "End",
            value: endTime,
            setter: setEndTime,
            options: endTimeOptions,
          },
          {
            label: "Energy",
            value: energy,
            setter: setEnergy,
            options: energyOptions,
          },
        ].map(({ label, value, setter, options }) => (
          <div key={label}>
            <p className="text-[10px] font-medium text-white/25 uppercase tracking-widest mb-1.5">
              {label}
            </p>
            <select
              value={value}
              onChange={(e) => setter(e.target.value)}
              className={selectClass}
            >
              {options.map((o) => (
                <option key={o} value={o} style={{ background: "#111" }}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-400/80 mb-3">{error}</p>}

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="
          w-full py-3 text-sm font-medium rounded-xl
          bg-white text-black
          hover:bg-white/90
          transition-colors duration-150
        "
      >
        Plan my day
      </motion.button>
    </motion.div>
  );
}
