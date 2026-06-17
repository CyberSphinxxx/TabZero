"use client";

import { useState, useRef, useEffect } from "react";
import { useBrainDump } from "@/hooks/use-brain-dump";

function formatTime(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours > 0) return `${hours}h left`;

  const minutes = Math.floor(diff / (60 * 1000));
  return `${minutes}m left`;
}

export function BrainDumpClient() {
  const { notes, loading, add, remove } = useBrainDump();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize the textarea as content grows
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [draft]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd + Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitNote();
    }
    // Escape to blur
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  function submitNote() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    add(trimmed);
    setDraft("");
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Quick Brain Dump
        </p>
        <div className="space-y-2">
          <div className="h-8 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 animate-pulse rounded bg-zinc-800/50" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Quick Brain Dump
      </p>

      {/* Scratchpad input */}
      <div
        className={`rounded-lg border transition-colors ${
          focused
            ? "border-zinc-600 bg-zinc-800/80"
            : "border-zinc-800 bg-zinc-900/50"
        }`}
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="What&apos;s on your mind?"
          rows={1}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
        />
      </div>
      {draft.trim().length > 0 && (
        <p className="text-right text-[10px] text-zinc-600">
          Ctrl+Enter to save
        </p>
      )}

      {/* Recent notes list */}
      {notes.length > 0 && (
        <div className="mt-1 space-y-1">
          {notes.slice(0, 5).map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-800/50"
            >
              <span className="mt-0.5 text-zinc-400 select-none">·</span>
              <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                {note.content}
              </p>
              <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[10px] text-zinc-600">
                  {formatTime(note.expiresAt)}
                </span>
                <button
                  onClick={() => remove(note.id)}
                  className="text-zinc-600 transition-colors hover:text-zinc-400"
                  aria-label="Dismiss note"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && !loading && (
        <p className="py-4 text-center text-sm text-zinc-600">
          Nothing yet. Write whatever comes to mind.
        </p>
      )}
    </div>
  );
}
