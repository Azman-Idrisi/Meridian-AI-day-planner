"use client";

import { motion } from "framer-motion";
import { ScheduleBlock } from "./TaskInput";

interface ScheduleViewProps {
  schedule: ScheduleBlock[];
  onReset: () => void;
}

const getAccent = (duration: string) => {
  const mins = parseInt(duration);
  if (mins <= 15) return "#4ade80";
  if (mins <= 30) return "#60a5fa";
  if (mins <= 60) return "#f59e0b";
  return "#a78bfa";
};

export default function ScheduleView({ schedule, onReset }: ScheduleViewProps) {
  const totalMinutes = schedule.reduce(
    (acc, b) => acc + (parseInt(b.duration) || 0),
    0,
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
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
          <h1 className="text-2xl font-light text-white tracking-tight">
            Today's schedule
          </h1>
          <p className="text-sm text-white/30 mt-1">
            {schedule.length} blocks · {totalHours}h total
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-white/30 hover:text-white/60 border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition-all mt-1"
        >
          ← replan
        </button>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-px">
        {schedule.map((block, i) => {
          const accent = getAccent(block.duration);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: i * 0.06,
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group grid grid-cols-[64px_1fr] gap-4 items-start py-4 border-b border-white/[0.06] last:border-0"
            >
              {/* Time */}
              <div className="text-right pt-0.5">
                <span className="text-[11px] font-mono text-white/25 group-hover:text-white/40 transition-colors">
                  {block.time}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white/85">
                    {block.task}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0"
                    style={{ color: accent, background: `${accent}18` }}
                  >
                    {block.duration}
                  </span>
                </div>
                <p className="text-xs text-white/30 leading-relaxed pr-2">
                  {block.reason}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mt-8">
        {[
          { label: "Total time", value: `${totalHours}h` },
          { label: "Blocks", value: schedule.length },
          { label: "Starts at", value: schedule[0]?.time ?? "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border border-white/[0.07] rounded-xl p-4 bg-white/[0.02]"
          >
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5">
              {label}
            </p>
            <p className="text-lg font-light text-white/80 font-mono">
              {value}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
