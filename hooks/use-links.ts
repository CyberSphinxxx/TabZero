"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/client/auth-context";
import {
  fetchLinks,
  addLink,
  deleteLink,
  updateLinkTags,
} from "@/lib/client/link";
import type { SavedLink } from "@/types/link";

const STORAGE_KEY = "tabzero:links";

export function useLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage instantly
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        setLinks(JSON.parse(cached));
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
    fetchLinks(user.uid)
      .then((fresh) => {
        if (cancelled) return;
        setLinks(fresh);
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
    async (url: string, title?: string) => {
      if (!user || !url.trim()) return;

      // Basic URL validation — prepend https:// if missing
      let normalizedUrl = url.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const now = Date.now();
      const optimistic: SavedLink = {
        id: `local-${now}`,
        url: normalizedUrl,
        title: title?.trim() || normalizedUrl,
        tags: [],
        createdAt: now,
      };

      const previous = links;
      const updated = [optimistic, ...links];
      setLinks(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        const serverLink = await addLink(user.uid, normalizedUrl, title);
        setLinks((prev) =>
          prev.map((l) => (l.id === optimistic.id ? serverLink : l)),
        );
        const cacheAfter = links.map((l) =>
          l.id === optimistic.id ? serverLink : l,
        );
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify([serverLink, ...cacheAfter]),
        );
      } catch {
        setLinks(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, links],
  );

  const updateTags = useCallback(
    async (linkId: string, tags: string[]) => {
      if (!user) return;

      // Optimistically update local state
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, tags } : l)),
      );
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(
          links.map((l) => (l.id === linkId ? { ...l, tags } : l)),
        ),
      );

      try {
        await updateLinkTags(user.uid, linkId, tags);
      } catch {
        // Revert on failure — reload from Firestore on next fetch
      }
    },
    [user, links],
  );

  const remove = useCallback(
    async (linkId: string) => {
      if (!user) return;

      const previous = links;
      const updated = links.filter((l) => l.id !== linkId);
      setLinks(updated);
      localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(updated));

      try {
        await deleteLink(user.uid, linkId);
      } catch {
        setLinks(previous);
        localStorage.setItem(`${STORAGE_KEY}:${user.uid}`, JSON.stringify(previous));
      }
    },
    [user, links],
  );

  return { links, loading, add, remove, updateTags };
}
