"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useTodos } from "@/hooks/use-todos";
import { useLinks } from "@/hooks/use-links";
import { useCalendar } from "@/hooks/use-calendar";
import { useKanban } from "@/hooks/use-kanban";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar,
  Columns3,
  Search,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { todos } = useTodos();
  const { links } = useLinks();
  const { items: kanbanItems } = useKanban();
  const { events } = useCalendar();

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback(
    (url?: string) => {
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setOpen(false);
    },
    [],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <CommandDialog>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput
            ref={inputRef}
            placeholder="Search todos, links, events, kanban cards…"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Todos */}
            {todos.length > 0 && (
              <CommandGroup heading="Todos">
                {todos.slice(0, 8).map((todo) => (
                  <CommandItem
                    key={todo.id}
                    onSelect={() => setOpen(false)}
                    className="flex items-center gap-2"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                    )}
                    <span
                      className={
                        todo.completed
                          ? "text-[var(--color-text-muted)] line-through"
                          : "text-[var(--color-text-primary)]"
                      }
                    >
                      {todo.text}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Links */}
            {links.length > 0 && (
              <CommandGroup heading="Links">
                {links.slice(0, 8).map((link) => (
                  <CommandItem
                    key={link.id}
                    onSelect={() => handleSelect(link.url)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                    <span className="flex-1 truncate text-[var(--color-text-primary)]">
                      {link.title}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">
                      {link.tags.length > 0 ? link.tags.join(", ") : ""}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Calendar events */}
            {events.length > 0 && (
              <CommandGroup heading="Events">
                {events.slice(0, 8).map((event) => (
                  <CommandItem
                    key={`${event.id}-${event.occurrenceDate}`}
                    onSelect={() => setOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-[var(--color-warning)] shrink-0" />
                    <span className="text-[var(--color-text-primary)]">{event.title}</span>
                    <span className="ml-auto text-[11px] text-[var(--color-text-muted)]">
                      {event.occurrenceDate}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Kanban cards */}
            {kanbanItems.length > 0 && (
              <CommandGroup heading="Kanban">
                {kanbanItems.slice(0, 8).map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => setOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <Columns3 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                    <span className="text-[var(--color-text-primary)]">{item.text}</span>
                    <span className="ml-auto text-[11px] uppercase text-[var(--color-text-muted)]">
                      {item.status}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </DialogPrimitive.Root>
  );
}
