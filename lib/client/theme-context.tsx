"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type ThemeName = "dark" | "rose" | "dracula" | "matrix" | "nord";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
  themes: { name: ThemeName; label: string }[];
}

const THEMES: { name: ThemeName; label: string }[] = [
  { name: "dark", label: "Dark" },
  { name: "rose", label: "Rose" },
  { name: "dracula", label: "Dracula" },
  { name: "matrix", label: "Matrix" },
  { name: "nord", label: "Nord" },
];

const STORAGE_KEY = "tabzero-theme";
const DEFAULT_THEME: ThemeName = "dark";

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((t) => t.name === stored)) return stored as ThemeName;
  return DEFAULT_THEME;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getInitialTheme();
    setThemeState(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeState(name);
    localStorage.setItem(STORAGE_KEY, name);
    document.documentElement.dataset.theme = name;
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : DEFAULT_THEME, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
