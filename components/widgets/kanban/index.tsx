import { GridCell } from "@/components/dashboard/grid-cell";
import { KanbanClient } from "./kanban-client";

export function KanbanBoard() {
  return (
    <GridCell className="flex flex-col">
      <KanbanClient />
    </GridCell>
  );
}
