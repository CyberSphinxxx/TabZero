"use client";

import { AuthProvider } from "@/lib/client/auth-context";
import { FocusProvider } from "@/lib/client/focus-context";
import { CommandPalette } from "@/components/dashboard/command-palette";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FocusProvider>
        {children}
        <CommandPalette />
      </FocusProvider>
    </AuthProvider>
  );
}
