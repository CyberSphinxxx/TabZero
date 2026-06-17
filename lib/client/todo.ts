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
import type { TodoItem } from "@/types/todo";

function getTodosRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "todos");
}

function todoDocRef(userId: string, todoId: string) {
  const db = getFirestore(getFirebaseApp());
  return doc(db, "users", userId, "todos", todoId);
}

function docToTodo(id: string, data: Record<string, unknown>): TodoItem {
  return {
    id,
    text: data.text as string,
    completed: data.completed as boolean,
    createdAt: (data.createdAt as Timestamp).toMillis(),
  };
}

export async function fetchTodos(userId: string): Promise<TodoItem[]> {
  const q = query(getTodosRef(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToTodo(d.id, d.data() as Record<string, unknown>),
  );
}

export async function addTodo(userId: string, text: string): Promise<TodoItem> {
  const now = Date.now();
  const docRef = await addDoc(getTodosRef(userId), {
    text,
    completed: false,
    createdAt: Timestamp.fromMillis(now),
  });
  return { id: docRef.id, text, completed: false, createdAt: now };
}

export async function toggleTodo(
  userId: string,
  todoId: string,
  currentCompleted: boolean,
): Promise<void> {
  const ref = todoDocRef(userId, todoId);
  await updateDoc(ref, { completed: !currentCompleted });
}

export async function deleteTodo(
  userId: string,
  todoId: string,
): Promise<void> {
  await deleteDoc(todoDocRef(userId, todoId));
}
