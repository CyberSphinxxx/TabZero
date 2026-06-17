import { GridCell } from "@/components/dashboard/grid-cell";
import { TodoClient } from "./todo-client";

export function TodoList() {
  return (
    <GridCell className="flex flex-col">
      <TodoClient />
    </GridCell>
  );
}
