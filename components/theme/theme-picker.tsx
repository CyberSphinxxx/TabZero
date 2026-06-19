"use client";

import { useTheme, type ThemeName } from "@/lib/client/theme-context";
import { Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const SWATCH_COLORS: Record<ThemeName, string> = {
  dark: "#18181b",
  rose: "#2c1d23",
  dracula: "#343746",
  matrix: "#0d1a12",
  nord: "#3b4252",
};

const ACCENT_COLORS: Record<ThemeName, string> = {
  dark: "#a78bfa",
  rose: "#f43f5e",
  dracula: "#ff79c6",
  matrix: "#00ff41",
  nord: "#88c0d0",
};

export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]"
        aria-label="Select theme"
      >
        <span
          className="inline-block h-4 w-4 rounded-full border border-[var(--color-border)]"
          style={{ backgroundColor: ACCENT_COLORS[theme] }}
        />
        <span className="text-xs font-medium capitalize">{theme}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl">
          <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Theme
          </p>
          {themes.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setTheme(t.name);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
                theme === t.name
                  ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span
                className="inline-block h-5 w-5 rounded-full border border-[var(--color-border)]"
                style={{ backgroundColor: SWATCH_COLORS[t.name] }}
              />
              <span className="flex-1 text-left text-xs">{t.label}</span>
              {theme === t.name && (
                <Check size={14} className="text-[var(--color-accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
