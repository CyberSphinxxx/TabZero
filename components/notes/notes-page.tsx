"use client";

import { BrainDumpClient } from "@/components/widgets/brain-dump/brain-dump-client";
import { useBrainDump } from "@/hooks/use-brain-dump";
import { Trash2 } from "lucide-react";
import { useState } from "react";

/** Simple relative-time helper (avoids needing date-fns as a dependency) */
function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function NotesPage() {
  const { notes, add, remove } = useBrainDump();
  const [filter, setFilter] = useState<"all" | "recent">("all");

  const displayedNotes = filter === "recent" ? notes.slice(0, 10) : notes;

  return (
    <div className="space-y-6">
      {/* Quick-add area */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          Quick Note
        </h2>
        <BrainDumpClient />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          All Notes
        </button>
        <button
          onClick={() => setFilter("recent")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "recent"
              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          Recent
        </button>
        <span className="text-xs text-[var(--color-text-muted)]">
          {notes.length} total
        </span>
      </div>

      {/* Notes list */}
      {displayedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No notes yet. Write something above.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayedNotes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-text-muted)]"
            >
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
                  {note.content}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {timeAgo(note.createdAt)}
                </p>
              </div>
              <button
                onClick={() => remove(note.id)}
                className="ml-4 shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] opacity-0 transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-danger)] group-hover:opacity-100"
                aria-label="Delete note"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
