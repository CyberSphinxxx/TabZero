"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

interface FocusContextValue {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  /** Remaining seconds in the current Pomodoro cycle */
  remaining: number;
  /** Total seconds for the current cycle */
  total: number;
  /** Whether the timer is actively counting down */
  timerActive: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

const POMODORO_SECONDS = 25 * 60; // 25 minutes

export function FocusProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [remaining, setRemaining] = useState(POMODORO_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        // Timer finished — stop and reset
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setTimerActive(false);
        setIsFocusMode(false);
        return POMODORO_SECONDS;
      }
      return prev - 1;
    });
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerActive(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRemaining(POMODORO_SECONDS);
    setTimerActive(false);
    setIsFocusMode(false);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  return (
    <FocusContext.Provider
      value={{
        isFocusMode,
        toggleFocusMode,
        remaining,
        total: POMODORO_SECONDS,
        timerActive,
        startTimer,
        pauseTimer,
        resetTimer,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus(): FocusContextValue {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
