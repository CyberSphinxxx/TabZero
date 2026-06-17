import { GridCell } from "@/components/dashboard/grid-cell";
import { LinkClient } from "./link-client";

export function LinkStash() {
  return (
    <GridCell className="flex flex-col">
      <LinkClient />
    </GridCell>
  );
}
