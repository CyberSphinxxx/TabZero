"use client";

import { useFocus } from "@/lib/client/focus-context";
import { Play, Pause, RotateCcw, Timer, Sparkles } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FocusToggle() {
  const {
    isFocusMode,
    toggleFocusMode,
    remaining,
    total,
    timerActive,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useFocus();

  const progress = ((total - remaining) / total) * 100;

  return (
    <div className="flex items-center gap-2">
      {/* Pomodoro timer */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1">
        <Timer size={12} className="text-zinc-500" />

        {/* Circular progress indicator */}
        <div className="relative h-4 w-4">
          <svg className="h-4 w-4 -rotate-90" viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="rgb(39 39 42)"
              strokeWidth="2"
            />
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke={
                remaining < 5 * 60
                  ? "rgb(239 68 68)"
                  : remaining < 10 * 60
                    ? "rgb(251 146 60)"
                    : "rgb(52 211 153)"
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 6}`}
              strokeDashoffset={2 * Math.PI * 6 - (progress / 100) * 2 * Math.PI * 6}
            />
          </svg>
        </div>

        <span
          className={`text-[11px] font-medium tabular-nums ${
            remaining < 5 * 60
              ? "text-red-400"
              : remaining < 10 * 60
                ? "text-amber-400"
                : "text-zinc-400"
          }`}
        >
          {formatTime(remaining)}
        </span>

        {/* Timer controls */}
        <button
          onClick={timerActive ? pauseTimer : startTimer}
          className="ml-0.5 rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
          aria-label={timerActive ? "Pause" : "Start"}
        >
          {timerActive ? <Pause size={10} /> : <Play size={10} />}
        </button>
        <button
          onClick={resetTimer}
          className="rounded p-0.5 text-zinc-700 transition-colors hover:text-zinc-400"
          aria-label="Reset"
        >
          <RotateCcw size={10} />
        </button>
      </div>

      {/* Focus mode toggle — only visible when timer is active or focus is on */}
      {(timerActive || isFocusMode) && (
        <button
          onClick={toggleFocusMode}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
            isFocusMode
              ? "border-emerald-700 bg-emerald-950/50 text-emerald-400"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles size={12} />
          {isFocusMode ? "Focus On" : "Focus Off"}
        </button>
      )}
    </div>
  );
}
