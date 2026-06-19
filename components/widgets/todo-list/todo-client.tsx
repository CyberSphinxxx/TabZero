"use client";

import { useState, useRef, useEffect } from "react";
import { useTodos } from "@/hooks/use-todos";
import { X } from "lucide-react";

export function TodoClient() {
  const { todos, loading, add, toggle, remove, incompleteCount } = useTodos();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-resize is not needed for single-line input, but keep focus on the
  // input after adding a task so the user can batch-enter tasks.

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    add(trimmed);
    setDraft("");
    // Re-focus the input after adding so the user can keep typing
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Todo List
        </p>
        <div className="space-y-2">
          <div className="h-9 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
          <div className="h-5 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Todo List
        </p>
        {todos.length > 0 && (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {incompleteCount} left
          </span>
        )}
      </div>

      {/* Add input */}
      <form onSubmit={handleSubmit} className="mt-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task…"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)] focus:bg-[var(--color-surface-hover)]/80"
        />
      </form>

      {/* List */}
      {todos.length > 0 ? (
        <div className="mt-1 max-h-[200px] space-y-0.5 overflow-y-auto pr-1 scrollbar-thin">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-hover)]/50"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle(todo.id, todo.completed)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  todo.completed
                    ? "border-[var(--color-success)] bg-[var(--color-success)]/20"
                    : "border-[var(--color-text-muted)] hover:border-[var(--color-text-secondary)]"
                }`}
                aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {todo.completed && (
                  <svg
                    width="10"
                    height="10"
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

              {/* Text */}
              <span
                className={`flex-1 truncate text-sm transition-colors ${
                  todo.completed
                    ? "text-[var(--color-text-muted)] line-through"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                {todo.text}
              </span>

              {/* Delete */}
              <button
                onClick={() => remove(todo.id)}
                className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-all hover:text-[var(--color-text-secondary)] group-hover:opacity-100"
                aria-label="Delete task"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
          Nothing urgent. Add a task &mdash; hit Enter to save.
        </p>
      )}
    </div>
  );
}
