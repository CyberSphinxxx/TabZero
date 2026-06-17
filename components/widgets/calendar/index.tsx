import { GridCell } from "@/components/dashboard/grid-cell";
import { CalendarClient } from "./calendar-client";

export function CalendarWidget() {
  return (
    <GridCell className="flex flex-col">
      <CalendarClient />
    </GridCell>
  );
}
