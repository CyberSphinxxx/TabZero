import { GridCell } from "@/components/dashboard/grid-cell";
import { ClassroomClient } from "./classroom-client";

export function ClassroomWidget() {
  return (
    <GridCell className="flex flex-col">
      <ClassroomClient />
    </GridCell>
  );
}
