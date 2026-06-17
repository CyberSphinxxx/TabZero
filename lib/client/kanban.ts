import {
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";
import type { KanbanItem, KanbanStatus } from "@/types/kanban";

function getKanbanRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "kanban");
}

function kanbanDocRef(userId: string, itemId: string) {
  const db = getFirestore(getFirebaseApp());
  return doc(db, "users", userId, "kanban", itemId);
}

function docToItem(id: string, data: Record<string, unknown>): KanbanItem {
  return {
    id,
    text: data.text as string,
    status: data.status as KanbanStatus,
    order: (data.order as number) ?? 0,
    createdAt: (data.createdAt as Timestamp).toMillis(),
  };
}

export async function fetchKanbanItems(
  userId: string,
): Promise<KanbanItem[]> {
  const q = query(getKanbanRef(userId), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToItem(d.id, d.data() as Record<string, unknown>),
  );
}

export async function addKanbanItem(
  userId: string,
  text: string,
  status: KanbanStatus,
  order: number,
): Promise<KanbanItem> {
  const now = Date.now();
  const docRef = await addDoc(getKanbanRef(userId), {
    text,
    status,
    order,
    createdAt: Timestamp.fromMillis(now),
  });
  return { id: docRef.id, text, status, order, createdAt: now };
}

export async function updateKanbanItem(
  userId: string,
  itemId: string,
  updates: { text?: string; status?: KanbanStatus; order?: number },
): Promise<void> {
  await updateDoc(kanbanDocRef(userId, itemId), updates);
}

export async function deleteKanbanItem(
  userId: string,
  itemId: string,
): Promise<void> {
  await deleteDoc(kanbanDocRef(userId, itemId));
}

/** Batch update status + order for multiple items (used after drag) */
export async function batchUpdateKanbanItems(
  userId: string,
  updates: Array<{ id: string; status: KanbanStatus; order: number }>,
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const batch = writeBatch(db);

  for (const update of updates) {
    const ref = kanbanDocRef(userId, update.id);
    batch.update(ref, { status: update.status, order: update.order });
  }

  await batch.commit();
}
