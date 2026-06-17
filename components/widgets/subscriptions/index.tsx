import { GridCell } from "@/components/dashboard/grid-cell";
import { SubscriptionClient } from "./subscription-client";

export function SubscriptionWidget() {
  return (
    <GridCell className="flex flex-col">
      <SubscriptionClient />
    </GridCell>
  );
}
