import {
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";
import type { CalendarEvent, CalendarEventInput } from "@/types/calendar";

function getEventsRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "events");
}

function eventDocRef(userId: string, eventId: string) {
  const db = getFirestore(getFirebaseApp());
  return doc(db, "users", userId, "events", eventId);
}

function docToEvent(id: string, data: Record<string, unknown>): CalendarEvent {
  return {
    id,
    title: data.title as string,
    description: (data.description as string) ?? "",
    start: (data.start as Timestamp).toDate().toISOString(),
    end: (data.end as Timestamp).toDate().toISOString(),
    allDay: (data.allDay as boolean) ?? false,
    repeat: (data.repeat as CalendarEvent["repeat"]) ?? "none",
    color: (data.color as string) ?? "#6366f1",
    createdAt: (data.createdAt as Timestamp).toMillis(),
  };
}

export async function fetchEvents(userId: string): Promise<CalendarEvent[]> {
  const q = query(getEventsRef(userId), orderBy("start", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToEvent(d.id, d.data() as Record<string, unknown>),
  );
}

export async function addEvent(
  userId: string,
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  const now = Date.now();
  const docRef = await addDoc(getEventsRef(userId), {
    title: input.title,
    description: input.description ?? "",
    start: Timestamp.fromDate(new Date(input.start)),
    end: Timestamp.fromDate(new Date(input.end)),
    allDay: input.allDay ?? false,
    repeat: input.repeat ?? "none",
    color: input.color ?? "#6366f1",
    createdAt: Timestamp.fromMillis(now),
  });

  return {
    id: docRef.id,
    title: input.title,
    description: input.description ?? "",
    start: input.start,
    end: input.end,
    allDay: input.allDay ?? false,
    repeat: input.repeat ?? "none",
    color: input.color ?? "#6366f1",
    createdAt: now,
  };
}

export async function updateEvent(
  userId: string,
  eventId: string,
  updates: Partial<CalendarEvent>,
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.start !== undefined)
    data.start = Timestamp.fromDate(new Date(updates.start));
  if (updates.end !== undefined)
    data.end = Timestamp.fromDate(new Date(updates.end));
  if (updates.allDay !== undefined) data.allDay = updates.allDay;
  if (updates.repeat !== undefined) data.repeat = updates.repeat;
  if (updates.color !== undefined) data.color = updates.color;

  await updateDoc(eventDocRef(userId, eventId), data);
}

export async function deleteEvent(
  userId: string,
  eventId: string,
): Promise<void> {
  await deleteDoc(eventDocRef(userId, eventId));
}
