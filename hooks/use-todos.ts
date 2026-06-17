"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { fetchTodos, addTodo, toggleTodo, deleteTodo } from "@/lib/client/todo";
import type { TodoItem } from "@/types/todo";

const STORAGE_KEY = "tabzero:todos";

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage instantly
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        setTodos(JSON.parse(cached));
        setLoading(false);
      } catch {
        // invalid cache
      }
    }
  }, [user]);

  // Sync from Firestore in background
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    fetchTodos(user.uid)
      .then((fresh) => {
        if (cancelled) return;
        setTodos(fresh);
        setLoading(false);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(fresh));
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const add = useCallback(
    async (text: string) => {
      if (!user || !text.trim()) return;

      const now = Date.now();
      const optimistic: TodoItem = {
        id: `local-${now}`,
        text: text.trim(),
        completed: false,
        createdAt: now,
      };

      const previous = todos;
      const updated = [optimistic, ...todos];
      setTodos(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        const serverTodo = await addTodo(user.uid, text.trim());
        setTodos((prev) =>
          prev.map((t) => (t.id === optimistic.id ? serverTodo : t)),
        );
        const cacheAfter = todos.map((t) =>
          t.id === optimistic.id ? serverTodo : t,
        );
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify([serverTodo, ...cacheAfter]),
        );
      } catch {
        setTodos(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, todos],
  );

  const toggle = useCallback(
    async (todoId: string, currentCompleted: boolean) => {
      if (!user) return;

      const previous = todos;
      const updated = todos.map((t) =>
        t.id === todoId ? { ...t, completed: !currentCompleted } : t,
      );
      setTodos(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        await toggleTodo(user.uid, todoId, currentCompleted);
      } catch {
        setTodos(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, todos],
  );

  const remove = useCallback(
    async (todoId: string) => {
      if (!user) return;

      const previous = todos;
      const updated = todos.filter((t) => t.id !== todoId);
      setTodos(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        await deleteTodo(user.uid, todoId);
      } catch {
        setTodos(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, todos],
  );

  const incompleteCount = todos.filter((t) => !t.completed).length;

  return { todos, loading, add, toggle, remove, incompleteCount };
}
