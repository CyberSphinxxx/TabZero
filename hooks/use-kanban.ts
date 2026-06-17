"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/client/auth-context";
import {
  fetchKanbanItems,
  addKanbanItem,
  updateKanbanItem,
  deleteKanbanItem,
  batchUpdateKanbanItems,
} from "@/lib/client/kanban";
import type { KanbanItem, KanbanStatus } from "@/types/kanban";

const STORAGE_KEY = "tabzero:kanban";

export function useKanban() {
  const { user } = useAuth();
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage instantly
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        setItems(JSON.parse(cached));
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
    fetchKanbanItems(user.uid)
      .then((fresh) => {
        if (cancelled) return;
        setItems(fresh);
        setLoading(false);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(fresh),
        );
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
      // Place at the top of the "todo" column
      const todoItems = items.filter((i) => i.status === "todo");
      const maxOrder = todoItems.length;

      const optimistic: KanbanItem = {
        id: `local-${now}`,
        text: text.trim(),
        status: "todo",
        order: maxOrder,
        createdAt: now,
      };

      const previous = items;
      const updated = [...items, optimistic];
      setItems(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        const serverItem = await addKanbanItem(
          user.uid,
          text.trim(),
          "todo",
          maxOrder,
        );
        setItems((prev) =>
          prev.map((i) => (i.id === optimistic.id ? serverItem : i)),
        );
      } catch {
        setItems(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, items],
  );

  const move = useCallback(
    async (
      itemId: string,
      newStatus: KanbanStatus,
      newOrder: number,
      allUpdates: Array<{ id: string; status: KanbanStatus; order: number }>,
    ) => {
      if (!user) return;

      const previous = items;

      // Optimistically apply all updates
      const updated = items.map((item) => {
        const update = allUpdates.find((u) => u.id === item.id);
        if (update) {
          return { ...item, status: update.status, order: update.order };
        }
        return item;
      });

      // Sort by order
      updated.sort((a, b) => a.order - b.order);

      setItems(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await batchUpdateKanbanItems(user.uid, allUpdates);
      } catch {
        setItems(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, items],
  );

  const updateText = useCallback(
    async (itemId: string, text: string) => {
      if (!user) return;

      const previous = items;
      const updated = items.map((i) =>
        i.id === itemId ? { ...i, text } : i,
      );
      setItems(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await updateKanbanItem(user.uid, itemId, { text });
      } catch {
        setItems(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, items],
  );

  const remove = useCallback(
    async (itemId: string) => {
      if (!user) return;

      const previous = items;
      const updated = items.filter((i) => i.id !== itemId);
      setItems(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await deleteKanbanItem(user.uid, itemId);
      } catch {
        setItems(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, items],
  );

  const itemsByStatus = {
    todo: items.filter((i) => i.status === "todo"),
    "in-progress": items.filter((i) => i.status === "in-progress"),
    done: items.filter((i) => i.status === "done"),
  };

  return { items, itemsByStatus, loading, add, move, updateText, remove };
}
