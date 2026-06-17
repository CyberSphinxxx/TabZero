"use client";

import { OneBigThing } from "@/components/widgets/one-big-thing";
import { BrainDump } from "@/components/widgets/brain-dump";
import { DeepSeekChat } from "@/components/widgets/deepseek-chat";
import { TodoList } from "@/components/widgets/todo-list";
import { TimeWeather } from "@/components/widgets/time-weather";
import { LinkStash } from "@/components/widgets/link-stash";
import { CalendarWidget } from "@/components/widgets/calendar";
import { KanbanBoard } from "@/components/widgets/kanban";
import { SubscriptionWidget } from "@/components/widgets/subscriptions";
import { ClassroomWidget } from "@/components/widgets/classroom";
import { FocusToggle } from "@/components/dashboard/focus-toggle";
import { useFocus } from "@/lib/client/focus-context";

/** Widgets that stay at full opacity during focus mode */
const FOCUS_SAFE = new Set(["one-big-thing", "brain-dump", "todo-list", "kanban"]);

function DimLayer({ id, children }: { id: string; children: React.ReactNode }) {
  const { isFocusMode } = useFocus();
  const shouldDim = isFocusMode && !FOCUS_SAFE.has(id);

  return (
    <div
      className={`transition-all duration-500 ${
        shouldDim ? "pointer-events-none opacity-20 blur-[2px]" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function DashboardGrid() {
  const { isFocusMode } = useFocus();

  return (
    <div className="relative">
      {/* Sticky header bar with focus toggle */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-4 py-2 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          TabZero
        </p>
        <FocusToggle />
      </div>

      {/* Focus overlay hint */}
      {isFocusMode && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-800/60 bg-emerald-950/70 px-4 py-2 text-xs text-emerald-400 shadow-lg backdrop-blur-sm">
          Focus mode active — distractions dimmed
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4 p-4">
        {/* Focus Banner — 12 cols, 1 row */}
        <div className="col-span-12" id="one-big-thing">
          <DimLayer id="one-big-thing">
            <OneBigThing />
          </DimLayer>
        </div>

        {/* Time & Weather — 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2" id="time-weather">
          <DimLayer id="time-weather">
            <TimeWeather />
          </DimLayer>
        </div>

        {/* Link Stash — 2 cols, 1 row */}
        <div className="col-span-2" id="link-stash">
          <DimLayer id="link-stash">
            <LinkStash />
          </DimLayer>
        </div>

        {/* Unified Calendar — 6 cols, 3 rows */}
        <div className="col-span-6 row-span-3" id="calendar">
          <DimLayer id="calendar">
            <CalendarWidget />
          </DimLayer>
        </div>

        {/* Quick Brain Dump — 4 cols, 1 row */}
        <div className="col-span-4" id="brain-dump">
          <DimLayer id="brain-dump">
            <BrainDump />
          </DimLayer>
        </div>

        {/* Todo List — 6 cols, 2 rows */}
        <div className="col-span-6 row-span-2" id="todo-list">
          <DimLayer id="todo-list">
            <TodoList />
          </DimLayer>
        </div>

        {/* DeepSeek AI Chat — 6 cols, 2 rows */}
        <div className="col-span-6 row-span-2" id="deepseek-chat">
          <DimLayer id="deepseek-chat">
            <DeepSeekChat />
          </DimLayer>
        </div>

        {/* Kanban Board — 12 cols, 2 rows */}
        <div className="col-span-12 row-span-2" id="kanban">
          <DimLayer id="kanban">
            <KanbanBoard />
          </DimLayer>
        </div>

        {/* Budget Tracker — 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2" id="budget">
          <DimLayer id="budget">
            <SubscriptionWidget />
          </DimLayer>
        </div>

        {/* Google Classroom — 4 cols, 2 rows */}
        <div className="col-span-4 row-span-2" id="classroom">
          <DimLayer id="classroom">
            <ClassroomWidget />
          </DimLayer>
        </div>
      </div>
    </div>
  );
}
