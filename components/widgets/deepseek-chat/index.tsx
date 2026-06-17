import { GridCell } from "@/components/dashboard/grid-cell";
import { ChatClient } from "./chat-client";

export function DeepSeekChat() {
  return (
    <GridCell className="flex flex-col">
      <ChatClient />
    </GridCell>
  );
}
