"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { fetchTasks, upsertTask, toggleTask } from "@/lib/client/tasks";
import type { AppTask } from "@/types/tasks";

const STORAGE_KEY = "tabzero:task";

export function useTask() {
  const { user } = useAuth();
  const [task, setTask] = useState<AppTask | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage instantly on mount
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        setTask(JSON.parse(cached));
        setLoading(false);
      } catch {
        // invalid cache, ignore
      }
    }
  }, [user]);

  // Sync from Firestore in background
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    fetchTasks(user.uid)
      .then((tasks) => {
        if (cancelled) return;
        const focusTask = tasks.find((t) => !t.completed) ?? tasks[0] ?? null;
        setTask(focusTask);
        setLoading(false);
        if (focusTask) {
          localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(focusTask));
        } else {
          localStorage.removeItem(`${STORAGE_KEY}:${user.uid}`);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const focusOn = useCallback(
    async (title: string) => {
      if (!user) return;

      const now = Date.now();
      const optimistic: AppTask = {
        id: `local-${now}`,
        title,
        completed: false,
        createdAt: now,
        completedAt: null,
      };

      // Optimistic update
      setTask(optimistic);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(optimistic));

      try {
        await upsertTask(user.uid, {
          id: optimistic.id,
          title: optimistic.title,
          completed: optimistic.completed,
        });
        // Re-fetch to get the real server ID if it was an insert
        const tasks = await fetchTasks(user.uid);
        const serverTask = tasks.find((t) => !t.completed) ?? tasks[0] ?? null;
        setTask(serverTask);
      } catch {
        // Roll back: re-fetch from server
        const tasks = await fetchTasks(user.uid);
        const serverTask = tasks.find((t) => !t.completed) ?? tasks[0] ?? null;
        setTask(serverTask);
      }
    },
    [user]
  );

  const toggleCompleted = useCallback(async () => {
    if (!user || !task) return;

    const previous = task;
    const optimistic: AppTask = { ...task, completed: !task.completed };
    setTask(optimistic);

    try {
      await toggleTask(user.uid, task.id, task.completed);
    } catch {
      setTask(previous);
    }
  }, [user, task]);

  return { task, loading, focusOn, toggleCompleted };
}
