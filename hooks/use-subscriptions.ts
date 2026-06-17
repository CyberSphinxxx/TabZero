"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/client/auth-context";
import {
  fetchSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/lib/client/subscriptions";
import type { Subscription, SubscriptionInput } from "@/types/subscription";

const STORAGE_KEY = "tabzero:subscriptions";

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage instantly
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        setSubscriptions(JSON.parse(cached));
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
    fetchSubscriptions(user.uid)
      .then((fresh) => {
        if (cancelled) return;
        setSubscriptions(fresh);
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
    async (input: SubscriptionInput) => {
      if (!user) return;

      const now = Date.now();
      const optimistic: Subscription = {
        id: `local-${now}`,
        name: input.name,
        cost: input.cost,
        currency: input.currency ?? "PHP",
        renewalDate: input.renewalDate,
        cycle: input.cycle,
        category: input.category,
        createdAt: now,
      };

      const previous = subscriptions;
      const updated = [...subscriptions, optimistic];
      setSubscriptions(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        const serverSub = await addSubscription(user.uid, input);
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === optimistic.id ? serverSub : s)),
        );
      } catch {
        setSubscriptions(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, subscriptions],
  );

  const update = useCallback(
    async (subId: string, updates: Partial<SubscriptionInput>) => {
      if (!user) return;

      const previous = subscriptions;
      const updated = subscriptions.map((s) =>
        s.id === subId ? { ...s, ...updates } : s,
      );
      setSubscriptions(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await updateSubscription(user.uid, subId, updates);
      } catch {
        setSubscriptions(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, subscriptions],
  );

  const remove = useCallback(
    async (subId: string) => {
      if (!user) return;

      const previous = subscriptions;
      const updated = subscriptions.filter((s) => s.id !== subId);
      setSubscriptions(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await deleteSubscription(user.uid, subId);
      } catch {
        setSubscriptions(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, subscriptions],
  );

  // Compute monthly total
  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((sum, sub) => {
      if (sub.cycle === "monthly") return sum + sub.cost;
      // yearly → monthly
      return sum + sub.cost / 12;
    }, 0);
  }, [subscriptions]);

  return {
    subscriptions,
    loading,
    add,
    update,
    remove,
    monthlyTotal,
  };
}
