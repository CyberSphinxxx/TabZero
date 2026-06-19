"use client";

import { OneBigThing } from "@/components/widgets/one-big-thing";
import dynamic from "next/dynamic";
import { useFocusActions } from "@/lib/client/focus-context";
import Link from "next/link";

const BrainDump = dynamic(
  () => import("@/components/widgets/brain-dump").then((m) => m.BrainDump),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3">
        <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        <div className="h-24 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
      </div>
    ),
  },
);

const TodoList = dynamic(
  () => import("@/components/widgets/todo-list").then((m) => m.TodoList),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          <div className="h-3 w-10 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        </div>
        <div className="h-9 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
        <div className="h-5 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
      </div>
    ),
  },
);

const TimeWeather = dynamic(
  () => import("@/components/widgets/time-weather").then((m) => m.TimeWeather),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col justify-between">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        <div className="mt-2 space-y-2">
          <div className="h-9 w-32 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          <div className="h-4 w-44 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />
          <div className="space-y-1">
            <div className="h-5 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
          </div>
        </div>
      </div>
    ),
  },
);

/** Widgets that stay at full opacity during focus mode */
const FOCUS_SAFE = new Set(["one-big-thing", "brain-dump", "todo-list"]);

function DimLayer({ id, children }: { id: string; children: React.ReactNode }) {
  const { isFocusMode } = useFocusActions();
  const shouldDim = isFocusMode && !FOCUS_SAFE.has(id);

  return (
    <div
      className={`transition-all duration-500 ${
        shouldDim ? "pointer-events-none opacity-20 blur-[2px]" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function DashboardGrid() {
  const { isFocusMode } = useFocusActions();

  return (
    <div className="relative">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-6 py-3 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Dashboard
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Your command center at a glance.
          </p>
        </div>
      </div>

      {/* Focus overlay hint */}
      {isFocusMode && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--color-success)]/60 bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-success)] shadow-lg backdrop-blur-sm">
          Focus mode active &mdash; distractions dimmed
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-6">
        {/* One Big Thing — 12 cols, 1 row */}
        <div className="col-span-12" id="one-big-thing">
          <DimLayer id="one-big-thing">
            <OneBigThing />
          </DimLayer>
        </div>

        {/* Time & Weather — 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2" id="time-weather">
          <DimLayer id="time-weather">
            <TimeWeather />
          </DimLayer>
        </div>

        {/* Quick Brain Dump — 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2" id="brain-dump">
          <DimLayer id="brain-dump">
            <BrainDump />
          </DimLayer>
        </div>

        {/* Todo List — 8 cols, 2 rows */}
        <div className="col-span-8 row-span-2" id="todo-list">
          <DimLayer id="todo-list">
            <TodoList />
          </DimLayer>
        </div>

        {/* Quick link to other sections */}
        <div className="col-span-4" id="quick-links">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href="/notes" label="Notes" />
              <QuickLink href="/chat" label="AI Chat" />
              <QuickLink href="/calendar" label="Calendar" />
              <QuickLink href="/kanban" label="Kanban" />
              <QuickLink href="/links" label="Links" />
              <QuickLink href="/subscriptions" label="Subscriptions" />
              <QuickLink href="/classroom" label="Classroom" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]"
    >
      {label}
    </Link>
  );
}
