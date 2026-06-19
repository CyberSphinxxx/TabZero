"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useKanban } from "@/hooks/use-kanban";
import type { KanbanItem, KanbanStatus } from "@/types/kanban";
import { Plus, X, GripVertical } from "lucide-react";

const COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "todo", label: "Todo" },
  { status: "in-progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

const COLUMN_COLORS: Record<KanbanStatus, string> = {
  todo: "border-l-zinc-600",
  "in-progress": "border-l-amber-600",
  done: "border-l-emerald-600",
};

const COLUMN_HEADER_COLORS: Record<KanbanStatus, string> = {
  todo: "text-[var(--color-text-muted)]",
  "in-progress": "text-[var(--color-warning)]",
  done: "text-[var(--color-success)]",
};

function KanbanCard({
  item,
  onDelete,
}: {
  item: KanbanItem;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface)]/80 px-3 py-2.5 transition-colors hover:border-[var(--color-text-muted)] ${
        isDragging ? "z-50 shadow-xl" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 cursor-grab text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)] active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={12} />
      </button>

      {/* Text */}
      <p className="flex-1 text-sm leading-relaxed text-[var(--color-text-primary)] break-words">
        {item.text}
      </p>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="mt-0.5 shrink-0 text-[var(--color-text-muted)] opacity-0 transition-all hover:text-[var(--color-danger)] group-hover:opacity-100"
        aria-label="Delete task"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  items,
  onAdd,
  onDelete,
  isOver,
}: {
  status: KanbanStatus;
  label: string;
  items: KanbanItem[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  isOver: boolean;
}) {
  const [draft, setDraft] = useState("");

  // Register as a droppable container with containerId in data
  const { setNodeRef: droppableRef } = useDroppable({
    id: `column-${status}`,
    data: { containerId: status },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  }

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  return (
    <div
      ref={droppableRef}
      className={`flex flex-col rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]/30 p-3 transition-colors ${
        isOver ? "border-[var(--color-text-muted)] bg-[var(--color-surface)]/60" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between">
        <p
          className={`text-xs font-medium uppercase tracking-widest ${COLUMN_HEADER_COLORS[status]}`}
        >
          {label}
        </p>
        <span className="text-[11px] text-[var(--color-text-muted)]">{items.length}</span>
      </div>

      {/* Add input (only on todo column) */}
      {status === "todo" && (
        <form onSubmit={handleSubmit} className="mb-2 mt-2">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-2 py-1.5 transition-colors focus-within:border-[var(--color-text-muted)]">
            <Plus size={12} className="text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add task…"
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </form>
      )}

      {/* Cards */}
      <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin" style={{ maxHeight: "280px" }}>
        {items.length > 0 ? (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <KanbanCard key={item.id} item={item} onDelete={onDelete} />
            ))}
          </SortableContext>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--color-text-muted)]">Empty</p>
        )}
      </div>
    </div>
  );
}

export function KanbanClient() {
  const { items, itemsByStatus, loading, add, move, remove } = useKanban();
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  const [overColumn, setOverColumn] = useState<KanbanStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragged = items.find((i) => i.id === event.active.id);
      if (dragged) setActiveItem(dragged);
    },
    [items],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // Determine which droppable container the pointer is over
      const containerId = event.over?.data?.current?.containerId as
        | KanbanStatus
        | undefined;
      setOverColumn(containerId ?? null);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      setOverColumn(null);

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const itemToMove = items.find((i) => i.id === activeId);
      if (!itemToMove) return;

      // Determine target column from the droppable container
      const overContainer = over.data?.current?.containerId as
        | KanbanStatus
        | undefined;
      if (!overContainer) return;

      const targetStatus = overContainer;
      const targetItems = items.filter((i) => i.status === targetStatus);

      // Build the new ordering for the target column
      const allUpdates: Array<{
        id: string;
        status: KanbanStatus;
        order: number;
      }> = [];

      let insertIndex = 0;

      // If over.id is a card (not the column itself), find position relative to it
      const isOverCard = targetItems.some((i) => i.id === over.id);
      if (over.id !== activeId && isOverCard) {
        const overIndex = targetItems.findIndex((i) => i.id === over.id);
        insertIndex = overIndex;
      } else if (over.id === `column-${targetStatus}`) {
        // Dropped directly on the empty area of the column — append to end
        insertIndex = targetItems.length;
      }

      // Reorder target column
      const reorderedTarget = [...targetItems];
      const existingAtTarget = reorderedTarget.find((i) => i.id === activeId);
      if (!existingAtTarget) {
        reorderedTarget.splice(insertIndex, 0, {
          ...itemToMove,
          status: targetStatus,
        } as KanbanItem);
      } else {
        // Already in this column — just reorder
        reorderedTarget.splice(reorderedTarget.indexOf(existingAtTarget), 1);
        reorderedTarget.splice(insertIndex, 0, existingAtTarget);
      }

      reorderedTarget.forEach((item, idx) => {
        allUpdates.push({
          id: item.id,
          status: targetStatus,
          order: idx,
        });
      });

      // If the item changed columns, also re-order the source column
      if (itemToMove.status !== targetStatus) {
        const sourceItems = items.filter(
          (i) => i.status === itemToMove.status && i.id !== activeId,
        );
        sourceItems.forEach((item, idx) => {
          allUpdates.push({
            id: item.id,
            status: itemToMove.status,
            order: idx,
          });
        });
      }

      move(activeId, targetStatus, 0, allUpdates);
    },
    [items, move],
  );

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]/30 p-3"
          >
            <div className="mb-3 h-4 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            <div className="space-y-2">
              <div className="h-14 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
              <div className="h-14 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
        Kanban
      </p>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-3 gap-2">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              items={itemsByStatus[col.status]}
              onAdd={add}
              onDelete={remove}
              isOver={overColumn === col.status}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--color-text-muted)] bg-[var(--color-surface-hover)] px-3 py-2.5 shadow-2xl">
              <GripVertical size={12} className="mt-0.5 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-primary)]">{activeItem.text}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
