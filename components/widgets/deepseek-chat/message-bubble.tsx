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
            ? "bg-zinc-700 text-zinc-300"
            : "bg-emerald-500/20 text-emerald-400"
        }`}
      >
        {isUser ? "U" : "T"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-800 text-zinc-200"
            : "bg-zinc-900/80 text-zinc-300"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
