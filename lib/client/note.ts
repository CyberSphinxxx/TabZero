import {
  doc,
  addDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";
import type { BrainDumpNote } from "@/types/note";

const NOTE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getNotesRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "notes");
}

function docToNote(
  id: string,
  data: Record<string, unknown>
): BrainDumpNote {
  return {
    id,
    content: data.content as string,
    createdAt: (data.createdAt as Timestamp).toMillis(),
    expiresAt: (data.expiresAt as Timestamp).toMillis(),
  };
}

export async function fetchNotes(userId: string): Promise<BrainDumpNote[]> {
  const q = query(getNotesRef(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const now = Date.now();

  return snapshot.docs
    .map((d) => docToNote(d.id, d.data() as Record<string, unknown>))
    .filter((n) => n.expiresAt > now);
}

export async function addNote(
  userId: string,
  content: string
): Promise<BrainDumpNote> {
  const now = Date.now();
  const docRef = await addDoc(getNotesRef(userId), {
    content,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + NOTE_TTL_MS),
  });

  return {
    id: docRef.id,
    content,
    createdAt: now,
    expiresAt: now + NOTE_TTL_MS,
  };
}

export async function deleteNote(
  userId: string,
  noteId: string
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  await deleteDoc(doc(db, "users", userId, "notes", noteId));
}
