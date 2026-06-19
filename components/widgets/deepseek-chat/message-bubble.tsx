import type { ReactNode } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  children: ReactNode;
}

export function MessageBubble({ role, children }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
          isUser
            ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
            : "bg-[var(--color-success)]/20 text-[var(--color-success)]"
        }`}
      >
        {isUser ? "U" : "T"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
            : "bg-[var(--color-surface)]/80 text-[var(--color-text-primary)]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
