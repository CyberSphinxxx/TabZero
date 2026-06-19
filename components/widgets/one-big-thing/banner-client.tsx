"use client";

import { useState, useRef, useEffect } from "react";
import { useTask } from "@/hooks/use-task";

export function BannerClient() {
  const { task, loading, focusOn, toggleCompleted } = useTask();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived states
  const isEmpty = !loading && !task;
  const hasTask = !loading && task && task.title.length > 0;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(task?.title ?? "");
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed.length > 0) {
      focusOn(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitEdit();
    }
    if (e.key === "Escape") {
      setEditing(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center gap-3">
        <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />
        <div className="h-5 flex-1 animate-pulse rounded bg-[var(--color-surface-hover)]" />
      </div>
    );
  }

  // Empty state — prompt to set focus
  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center gap-4">
        <span className="text-2xl">🎯</span>
        <button
          onClick={startEditing}
          className="text-left text-lg font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          What&apos;s the one thing you need to get done today?
        </button>
      </div>
    );
  }

  // Editing state
  if (editing) {
    return (
      <div className="flex flex-1 items-center gap-4">
        <span className="text-2xl">🎯</span>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          placeholder="What&apos;s the one thing?"
          className="flex-1 bg-transparent text-lg font-medium text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>
    );
  }

  // Has focus task — show with checkbox
  return (
    <div className="flex flex-1 items-center gap-4">
      <button
        onClick={toggleCompleted}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          task?.completed
            ? "border-[var(--color-success)] bg-[var(--color-success)]/20"
            : "border-[var(--color-text-muted)] hover:border-[var(--color-text-secondary)]"
        }`}
        aria-label={task?.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task?.completed && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-success)]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span className="text-2xl">🎯</span>
      <button
        onClick={startEditing}
        className={`text-left text-lg font-medium transition-colors hover:text-[var(--color-text-secondary)] ${
          task?.completed
            ? "text-[var(--color-text-muted)] line-through"
            : "text-[var(--color-text-primary)]"
        }`}
      >
        {task?.title}
      </button>
    </div>
  );
}
