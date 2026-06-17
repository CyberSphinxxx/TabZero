"use client";

import { useState } from "react";
import type { CalendarEventInput } from "@/types/calendar";
import { X } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#a855f7", // purple
];

interface Props {
  isOpen: boolean;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (input: CalendarEventInput) => void;
}

export function AddEventModal({
  isOpen,
  defaultDate,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [repeat, setRepeat] = useState<"none" | "weekly">("none");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: "",
      start: `${startDate}T${startTime}:00`,
      end: `${startDate}T${endTime}:00`,
      allDay: false,
      repeat,
      color,
    });

    // Reset form
    setTitle("");
    setStartDate(defaultDate);
    setStartTime("08:00");
    setEndTime("09:00");
    setRepeat("none");
    setColor(PRESET_COLORS[0]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-200">New Event</p>
          <button
            onClick={onClose}
            className="text-zinc-600 transition-colors hover:text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            autoFocus
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          {/* Date */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-zinc-500">
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-500">
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Repeat */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-zinc-500">Repeat</label>
            <button
              type="button"
              onClick={() => setRepeat(repeat === "none" ? "weekly" : "none")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                repeat === "weekly"
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {repeat === "weekly" ? "Weekly" : "None"}
            </button>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Color</span>
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white/30" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim()}
            className="mt-1 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-30"
          >
            Add Event
          </button>
        </form>
      </div>
    </div>
  );
}
