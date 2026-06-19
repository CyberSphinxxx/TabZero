"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemePicker } from "@/components/theme/theme-picker";
import {
  LayoutDashboard,
  StickyNote,
  Bot,
  CalendarDays,
  Columns3,
  Link2,
  Repeat2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Timer,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "AI Chat", href: "/chat", icon: Bot },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Kanban", href: "/kanban", icon: Columns3 },
  { label: "Links", href: "/links", icon: Link2 },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat2 },
  { label: "Classroom", href: "/classroom", icon: GraduationCap },
];

function FocusTimer() {
  const [remaining, setRemaining] = useState(25 * 60);
  const [active, setActive] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <Timer size={14} className="text-[var(--color-text-muted)]" />
      <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
        {formatTime(remaining)}
      </span>
      <button
        onClick={() => setActive((p) => !p)}
        className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
        aria-label={active ? "Pause timer" : "Start timer"}
      >
        <Sparkles size={12} />
      </button>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand header */}
      <div className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] px-4">
        <PanelLeft size={18} className="shrink-0 text-[var(--color-accent)]" />
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
            TabZero
          </span>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <item.icon
                size={18}
                className={`shrink-0 ${
                  isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: timer + theme + collapse */}
      <div className="space-y-2 border-t border-[var(--color-border)] px-2 py-3">
        {!collapsed && <FocusTimer />}
        <ThemePicker />
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={16} className="mx-auto" />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
