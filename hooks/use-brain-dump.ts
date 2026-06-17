"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { fetchNotes, addNote, deleteNote } from "@/lib/client/note";
import type { BrainDumpNote } from "@/types/note";

const STORAGE_KEY = "tabzero:brain-dump";

export function useBrainDump() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<BrainDumpNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage instantly
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        const parsed: BrainDumpNote[] = JSON.parse(cached);
        const now = Date.now();
        setNotes(parsed.filter((n) => n.expiresAt > now));
        setLoading(false);
      } catch {
        // invalid cache
      }
    }
  }, [user]);

  // Sync from Firestore in background, overwrite cache
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    fetchNotes(user.uid)
      .then((fresh) => {
        if (cancelled) return;
        setNotes(fresh);
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
    async (content: string) => {
      if (!user || !content.trim()) return;

      const now = Date.now();
      const optimistic: BrainDumpNote = {
        id: `local-${now}`,
        content: content.trim(),
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
      };

      const previous = notes;
      const updated = [optimistic, ...notes];
      setNotes(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        const serverNote = await addNote(user.uid, content.trim());
        setNotes((prev) =>
          prev.map((n) => (n.id === optimistic.id ? serverNote : n))
        );
        const updatedCache = notes.map((n) =>
          n.id === optimistic.id ? serverNote : n
        );
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify([serverNote, ...updatedCache])
        );
      } catch {
        setNotes(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, notes]
  );

  const remove = useCallback(
    async (noteId: string) => {
      if (!user) return;

      const previous = notes;
      const updated = notes.filter((n) => n.id !== noteId);
      setNotes(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        await deleteNote(user.uid, noteId);
      } catch {
        setNotes(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, notes]
  );

  return { notes, loading, add, remove };
}
