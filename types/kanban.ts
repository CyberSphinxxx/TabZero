export type KanbanStatus = "todo" | "in-progress" | "done";

export interface KanbanItem {
  id: string;
  text: string;
  status: KanbanStatus;
  order: number;
  createdAt: number;
}

export interface KanbanItemInput {
  text: string;
  status?: KanbanStatus;
  order?: number;
}
