"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/client/auth-context";
import {
  fetchEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/client/calendar";
import type {
  CalendarEvent,
  CalendarEventInput,
} from "@/types/calendar";

const STORAGE_KEY = "tabzero:events";

/** Convert an ISO string to YYYY-MM-DD for day comparison */
function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Get Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get Sunday of the week containing the given date */
export function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Format a Date to ISO date string (YYYY-MM-DD) */
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface ExpandedEvent extends CalendarEvent {
  /** The date this occurrence falls on (YYYY-MM-DD) */
  occurrenceDate: string;
  /** Whether this is a recurring instance */
  isRecurring: boolean;
}

function expandRecurringEvents(
  events: CalendarEvent[],
  windowStart: Date,
  windowEnd: Date,
): ExpandedEvent[] {
  const expanded: ExpandedEvent[] = [];

  for (const event of events) {
    if (event.repeat === "none") {
      expanded.push({
        ...event,
        occurrenceDate: toDateKey(event.start),
        isRecurring: false,
      });
      continue;
    }

    // Weekly recurring: generate occurrences within the window
    const eventStart = new Date(event.start);
    const eventDayOfWeek = eventStart.getDay();
    const eventDuration =
      new Date(event.end).getTime() - eventStart.getTime();

    // Walk from window start to window end, find matching days
    const cursor = new Date(windowStart);
    while (cursor <= windowEnd) {
      if (cursor.getDay() === eventDayOfWeek) {
        const occurrenceStart = new Date(cursor);
        occurrenceStart.setHours(
          eventStart.getHours(),
          eventStart.getMinutes(),
          0,
          0,
        );
        const occurrenceEnd = new Date(
          occurrenceStart.getTime() + eventDuration,
        );

        expanded.push({
          ...event,
          start: occurrenceStart.toISOString(),
          end: occurrenceEnd.toISOString(),
          occurrenceDate: toISODate(cursor),
          isRecurring: true,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return expanded;
}

export function useCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Current view week
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  // Hydrate from localStorage instantly
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`${STORAGE_KEY}:${user.uid}`);
    if (cached) {
      try {
        setEvents(JSON.parse(cached));
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
    fetchEvents(user.uid)
      .then((fresh) => {
        if (cancelled) return;
        setEvents(fresh);
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

  // Expanded events for the current week view
  const weekEvents = useMemo(
    () => expandRecurringEvents(events, weekStart, weekEnd),
    [events, weekStart, weekEnd],
  );

  const goToToday = useCallback(() => setWeekOffset(0), []);
  const goNextWeek = useCallback(
    () => setWeekOffset((o) => o + 1),
    [],
  );
  const goPrevWeek = useCallback(
    () => setWeekOffset((o) => o - 1),
    [],
  );

  const add = useCallback(
    async (input: CalendarEventInput) => {
      if (!user) return;

      const now = Date.now();
      const optimistic: CalendarEvent = {
        id: `local-${now}`,
        title: input.title,
        description: input.description ?? "",
        start: input.start,
        end: input.end,
        allDay: input.allDay ?? false,
        repeat: input.repeat ?? "none",
        color: input.color ?? "#6366f1",
        createdAt: now,
      };

      const previous = events;
      const updated = [...events, optimistic];
      setEvents(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        const serverEvent = await addEvent(user.uid, input);
        setEvents((prev) =>
          prev.map((e) => (e.id === optimistic.id ? serverEvent : e)),
        );
      } catch {
        setEvents(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, events],
  );

  const update = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>) => {
      if (!user) return;

      const previous = events;
      const updated = events.map((e) =>
        e.id === eventId ? { ...e, ...updates } : e,
      );
      setEvents(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await updateEvent(user.uid, eventId, updates);
      } catch {
        setEvents(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, events],
  );

  const remove = useCallback(
    async (eventId: string) => {
      if (!user) return;

      const previous = events;
      const updated = events.filter((e) => e.id !== eventId);
      setEvents(updated);
      localStorage.setItem(
        `${STORAGE_KEY}:${user.uid}`,
        JSON.stringify(updated),
      );

      try {
        await deleteEvent(user.uid, eventId);
      } catch {
        setEvents(previous);
        localStorage.setItem(
          `${STORAGE_KEY}:${user.uid}`,
          JSON.stringify(previous),
        );
      }
    },
    [user, events],
  );

  return {
    events: weekEvents,
    rawCount: events.length,
    loading,
    weekStart,
    weekEnd,
    weekOffset,
    goToToday,
    goNextWeek,
    goPrevWeek,
    add,
    update,
    remove,
  };
}
