import type { ReactNode } from "react";

interface GridCellProps {
  children: ReactNode;
  className?: string;
}

export function GridCell({ children, className = "" }: GridCellProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-zinc-900/50 p-4 ${className}`}
    >
      {children}
    </div>
  );
}
