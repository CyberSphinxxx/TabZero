"use client";

import dynamic from "next/dynamic";

const KanbanBoard = dynamic(
  () => import("@/components/widgets/kanban").then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]/30 p-3"
          >
            <div className="mb-3 h-4 w-16 rounded bg-[var(--color-surface-hover)]" />
            <div className="space-y-2">
              <div className="h-14 rounded-lg bg-[var(--color-surface-hover)]/50" />
              <div className="h-14 rounded-lg bg-[var(--color-surface-hover)]/50" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
);

export default function KanbanPage() {
  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Kanban Board
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Track tasks and projects visually.
        </p>
      </div>
      <div className="flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
