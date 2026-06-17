import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";
import type { AppTask } from "@/types/tasks";

function getTasksRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "tasks");
}

function taskDocRef(userId: string, taskId: string) {
  const db = getFirestore(getFirebaseApp());
  return doc(db, "users", userId, "tasks", taskId);
}

function docToTask(
  id: string,
  data: Record<string, unknown>
): AppTask {
  return {
    id,
    title: data.title as string,
    completed: data.completed as boolean,
    createdAt: (data.createdAt as Timestamp).toMillis(),
    completedAt: data.completedAt
      ? (data.completedAt as Timestamp).toMillis()
      : null,
  };
}

export async function fetchTasks(userId: string): Promise<AppTask[]> {
  const q = query(getTasksRef(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToTask(d.id, d.data() as Record<string, unknown>));
}

export async function upsertTask(
  userId: string,
  task: { id: string; title: string; completed: boolean }
): Promise<void> {
  const now = Date.now();
  const ref = taskDocRef(userId, task.id);

  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, {
      title: task.title,
      completed: task.completed,
      updatedAt: Timestamp.fromMillis(now),
      completedAt: task.completed ? Timestamp.fromMillis(now) : null,
    });
  } else {
    await setDoc(ref, {
      title: task.title,
      completed: task.completed,
      createdAt: Timestamp.fromMillis(now),
      updatedAt: Timestamp.fromMillis(now),
      completedAt: task.completed ? Timestamp.fromMillis(now) : null,
    });
  }
}

export async function toggleTask(
  userId: string,
  taskId: string,
  currentCompleted: boolean
): Promise<void> {
  const now = Date.now();
  const ref = taskDocRef(userId, taskId);
  await updateDoc(ref, {
    completed: !currentCompleted,
    completedAt: currentCompleted ? null : Timestamp.fromMillis(now),
    updatedAt: Timestamp.fromMillis(now),
  });
}
