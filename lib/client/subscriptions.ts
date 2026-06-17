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
import type { Subscription, SubscriptionInput, RenewalCycle } from "@/types/subscription";

function getSubscriptionsRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "subscriptions");
}

function subDocRef(userId: string, subId: string) {
  const db = getFirestore(getFirebaseApp());
  return doc(db, "users", userId, "subscriptions", subId);
}

function docToSub(id: string, data: Record<string, unknown>): Subscription {
  return {
    id,
    name: data.name as string,
    cost: (data.cost as number) ?? 0,
    currency: (data.currency as string) ?? "PHP",
    renewalDate: data.renewalDate as string,
    cycle: (data.cycle as RenewalCycle) ?? "monthly",
    category: (data.category as string) ?? undefined,
    createdAt: (data.createdAt as Timestamp).toMillis(),
  };
}

export async function fetchSubscriptions(
  userId: string,
): Promise<Subscription[]> {
  const q = query(getSubscriptionsRef(userId), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToSub(d.id, d.data() as Record<string, unknown>),
  );
}

export async function addSubscription(
  userId: string,
  input: SubscriptionInput,
): Promise<Subscription> {
  const now = Date.now();
  const docRef = await addDoc(getSubscriptionsRef(userId), {
    name: input.name,
    cost: input.cost,
    currency: input.currency ?? "PHP",
    renewalDate: input.renewalDate,
    cycle: input.cycle,
    category: input.category ?? null,
    createdAt: Timestamp.fromMillis(now),
  });

  return {
    id: docRef.id,
    name: input.name,
    cost: input.cost,
    currency: input.currency ?? "PHP",
    renewalDate: input.renewalDate,
    cycle: input.cycle,
    category: input.category,
    createdAt: now,
  };
}

export async function updateSubscription(
  userId: string,
  subId: string,
  updates: Partial<SubscriptionInput>,
): Promise<void> {
  const cleanUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.cost !== undefined) cleanUpdates.cost = updates.cost;
  if (updates.currency !== undefined) cleanUpdates.currency = updates.currency;
  if (updates.renewalDate !== undefined)
    cleanUpdates.renewalDate = updates.renewalDate;
  if (updates.cycle !== undefined) cleanUpdates.cycle = updates.cycle;
  if (updates.category !== undefined) cleanUpdates.category = updates.category;

  await updateDoc(subDocRef(userId, subId), cleanUpdates);
}

export async function deleteSubscription(
  userId: string,
  subId: string,
): Promise<void> {
  await deleteDoc(subDocRef(userId, subId));
}
