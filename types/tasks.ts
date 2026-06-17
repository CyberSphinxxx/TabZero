export interface AppTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}
