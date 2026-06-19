"use client";

import dynamic from "next/dynamic";

const DeepSeekChat = dynamic(
  () => import("@/components/widgets/deepseek-chat").then((m) => m.DeepSeekChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        <div className="mt-4 flex-1 space-y-3">
          <div className="h-16 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
          <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
          <div className="h-20 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
        </div>
      </div>
    ),
  },
);

export default function ChatPage() {
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          AI Chat
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Ask questions, brainstorm, or get help with your work.
        </p>
      </div>
      <div className="flex-1">
        <DeepSeekChat />
      </div>
    </div>
  );
}
