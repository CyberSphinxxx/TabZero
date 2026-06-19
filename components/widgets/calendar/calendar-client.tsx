"use client";

import { useState, useMemo } from "react";
import { useCalendar, getWeekStart } from "@/hooks/use-calendar";
import { AddEventModal } from "./add-event-modal";
import type { CalendarEventInput } from "@/types/calendar";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 7); // 7 AM – 4 PM

/** Get the 7 dates for the current week */
function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-PH", opts)} – ${end.toLocaleDateString("en-PH", opts)}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

interface EventBlock {
  id: string;
  title: string;
  color: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  durationHours: number;
  isRecurring: boolean;
}

export function CalendarClient() {
  const {
    events,
    loading,
    weekStart,
    goToToday,
    goNextWeek,
    goPrevWeek,
    add,
    remove,
  } = useCalendar();

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventBlock | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Group events by day column
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventBlock[]>();

    for (const event of events) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const dayKey = event.occurrenceDate;

      if (!map.has(dayKey)) map.set(dayKey, []);

      map.get(dayKey)!.push({
        id: event.id,
        title: event.title,
        color: event.color,
        startHour: start.getHours(),
        startMin: start.getMinutes(),
        endHour: end.getHours(),
        endMin: end.getMinutes(),
        durationHours:
          (end.getTime() - start.getTime()) / (1000 * 60 * 60),
        isRecurring: event.isRecurring,
      });
    }

    return map;
  }, [events]);

  const defaultDate = useMemo(
    () =>
      isToday(new Date())
        ? new Date().toISOString().slice(0, 10)
        : weekStart.toISOString().slice(0, 10),
    [weekStart],
  );

  function handleAdd(input: CalendarEventInput) {
    add(input);
    setShowModal(false);
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 animate-pulse rounded bg-[var(--color-surface-hover)]" />
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-full animate-pulse rounded bg-[var(--color-surface-hover)]" />
              <div className="h-12 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Calendar
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrevWeek}
            className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="Previous week"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={goToToday}
            className="rounded px-2 py-0.5 text-[11px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Today
          </button>
          <button
            onClick={goNextWeek}
            className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="Next week"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="ml-1 flex items-center gap-1 rounded-md bg-[var(--color-surface-hover)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border)]"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
      </div>

      {/* Week range label */}
      <p className="text-[11px] text-[var(--color-text-muted)]">
        {formatWeekRange(weekStart)}
      </p>

      {/* Day headers + compact grid */}
      <div className="mt-1 grid grid-cols-7 gap-px rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-surface-hover)]/20 overflow-hidden">
        {/* Day headers */}
        {weekDates.map((date, i) => (
          <div
            key={i}
            className={`px-1.5 py-1.5 text-center text-[10px] font-medium uppercase ${
              isToday(date)
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "bg-[var(--color-surface)]/50 text-[var(--color-text-muted)]"
            }`}
          >
            <span>{DAY_NAMES[i]}</span>
            <span
              className={`ml-1 rounded-full px-1.5 text-[10px] ${
                isToday(date) ? "bg-[var(--color-accent)] text-[var(--color-bg)]" : ""
              }`}
            >
              {date.getDate()}
            </span>
          </div>
        ))}

        {/* Hour rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            {weekDates.map((date, dayIdx) => {
              const dayKey = date.toISOString().slice(0, 10);
              const dayEvents = eventsByDay.get(dayKey) ?? [];
              const cellEvents = dayEvents.filter(
                (e) => e.startHour <= hour && e.endHour > hour,
              );

              return (
                <div
                  key={`${dayIdx}-${hour}`}
                  className="min-h-[28px] border-t border-[var(--color-border)]/30 bg-[var(--color-bg)]/20 px-1 py-0.5"
                >
                  {cellEvents.map((event) => {
                    const isFirst =
                      event.startHour === hour &&
                      event.startMin < 60;
                    return isFirst ? (
                      <button
                        key={event.id}
                        onClick={() =>
                          setSelectedEvent(
                            selectedEvent?.id === event.id
                              ? null
                              : event,
                          )
                        }
                        className="w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight text-white transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: event.color + "cc",
                        }}
                      >
                        {event.title}
                        {event.isRecurring && (
                          <span className="ml-0.5 opacity-70">
                            ↻
                          </span>
                        )}
                      </button>
                    ) : null;
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Event detail popover */}
      {selectedEvent && (
        <div className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedEvent.color }}
              />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {selectedEvent.title}
              </p>
              {selectedEvent.isRecurring && (
                <span className="text-[10px] text-[var(--color-text-muted)]">↻ Weekly</span>
              )}
            </div>
            <button
              onClick={() => {
                remove(selectedEvent.id);
                setSelectedEvent(null);
              }}
              className="text-[11px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-danger)]"
            >
              Delete
            </button>
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            {`${selectedEvent.startHour.toString().padStart(2, "0")}:${selectedEvent.startMin.toString().padStart(2, "0")}`}{" "}
            –{" "}
            {`${selectedEvent.endHour.toString().padStart(2, "0")}:${selectedEvent.endMin.toString().padStart(2, "0")}`}
          </p>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && !selectedEvent && (
        <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
          No events this week. Click Add to schedule something.
        </p>
      )}

      {/* Add modal */}
      <AddEventModal
        isOpen={showModal}
        defaultDate={defaultDate}
        onClose={() => setShowModal(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
}
