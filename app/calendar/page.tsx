"use client";

import dynamic from "next/dynamic";

const CalendarWidget = dynamic(
  () => import("@/components/widgets/calendar").then((m) => m.CalendarWidget),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-full animate-pulse rounded bg-[var(--color-surface-hover)]" />
              <div className="h-12 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
);

export default function CalendarPage() {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your schedule at a glance.
        </p>
      </div>
      <div className="flex-1">
        <CalendarWidget />
      </div>
    </div>
  );
}
