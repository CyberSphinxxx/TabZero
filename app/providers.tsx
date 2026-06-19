"use client";

import { AuthProvider } from "@/lib/client/auth-context";
import { FocusProvider } from "@/lib/client/focus-context";
import { ThemeProvider } from "@/lib/client/theme-context";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CommandPalette = dynamic(
  () => import("@/components/dashboard/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FocusProvider>
          {children}
          <CommandPalette />
        </FocusProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
