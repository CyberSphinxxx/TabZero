import type { ReactNode } from "react";

interface GridCellProps {
  children: ReactNode;
  className?: string;
}

export function GridCell({ children, className = "" }: GridCellProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}
