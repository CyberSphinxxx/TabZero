import { GridCell } from "@/components/dashboard/grid-cell";
import { BannerClient } from "./banner-client";

export function OneBigThing() {
  return (
    <GridCell className="flex items-center gap-4 px-6 py-4">
      <BannerClient />
    </GridCell>
  );
}
