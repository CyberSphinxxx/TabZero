export type RepeatType = "none" | "weekly";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;      // ISO 8601
  end: string;        // ISO 8601
  allDay: boolean;
  repeat: RepeatType;
  color: string;      // hex
  createdAt: number;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  repeat?: RepeatType;
  color?: string;
}
