"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
  type ReactNode,
} from "react";

// --------------- Stable actions context (rarely changes) ---------------

interface FocusActions {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

const FocusActionsContext = createContext<FocusActions | null>(null);

// --------------- Fast-changing timer state context ---------------

interface TimerState {
  remaining: number;
  total: number;
  timerActive: boolean;
}

const TimerStateContext = createContext<TimerState | null>(null);

// --------------- Full value (backward-compatible) ---------------

interface FocusContextValue extends FocusActions, TimerState {}

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

  const actions: FocusActions = {
    isFocusMode,
    toggleFocusMode,
    startTimer,
    pauseTimer,
    resetTimer,
  };

  const timerState: TimerState = {
    remaining,
    total: POMODORO_SECONDS,
    timerActive,
  };

  return (
    <FocusContext.Provider
      value={{ ...actions, ...timerState }}
    >
      <FocusActionsContext.Provider value={actions}>
        <TimerStateContext.Provider value={timerState}>
          {children}
        </TimerStateContext.Provider>
      </FocusActionsContext.Provider>
    </FocusContext.Provider>
  );
}

/**
 * Full focus context — re-renders on every timer tick when active.
 * Use `useFocusActions()` when you only need action callbacks (no timer state).
 */
export function useFocus(): FocusContextValue {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}

/**
 * Stable action callbacks only — never re-renders on timer ticks.
 * Use this in components that only call start/pause/reset/toggle.
 */
export function useFocusActions(): FocusActions {
  const context = useContext(FocusActionsContext);
  if (!context) {
    throw new Error("useFocusActions must be used within a FocusProvider");
  }
  return context;
}

/**
 * Timer state only — re-renders on every tick when active.
 * Use this in components that display remaining time.
 */
export function useTimerState(): TimerState {
  const context = useContext(TimerStateContext);
  if (!context) {
    throw new Error("useTimerState must be used within a FocusProvider");
  }
  return context;
}
