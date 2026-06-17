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
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Todo List
        </p>
        <div className="space-y-2">
          <div className="h-9 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-5 animate-pulse rounded bg-zinc-800/50" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Todo List
        </p>
        {todos.length > 0 && (
          <span className="text-[11px] text-zinc-600">
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
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600 focus:bg-zinc-800/80"
        />
      </form>

      {/* List */}
      {todos.length > 0 ? (
        <div className="mt-1 max-h-[200px] space-y-0.5 overflow-y-auto pr-1 scrollbar-thin">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-800/50"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle(todo.id, todo.completed)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  todo.completed
                    ? "border-emerald-500 bg-emerald-500/20"
                    : "border-zinc-600 hover:border-zinc-400"
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
                    className="text-emerald-400"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Text */}
              <span
                className={`flex-1 truncate text-sm transition-colors ${
                  todo.completed
                    ? "text-zinc-600 line-through"
                    : "text-zinc-300"
                }`}
              >
                {todo.text}
              </span>

              {/* Delete */}
              <button
                onClick={() => remove(todo.id)}
                className="shrink-0 text-zinc-700 opacity-0 transition-all hover:text-zinc-400 group-hover:opacity-100"
                aria-label="Delete task"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-zinc-600">
          Nothing urgent. Add a task &mdash; hit Enter to save.
        </p>
      )}
    </div>
  );
}
