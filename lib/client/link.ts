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
import type { SavedLink } from "@/types/link";

function getLinksRef(userId: string) {
  const db = getFirestore(getFirebaseApp());
  return collection(db, "users", userId, "links");
}

function linkDocRef(userId: string, linkId: string) {
  const db = getFirestore(getFirebaseApp());
  return doc(db, "users", userId, "links", linkId);
}

function docToLink(id: string, data: Record<string, unknown>): SavedLink {
  return {
    id,
    url: data.url as string,
    title: data.title as string,
    tags: (data.tags as string[]) ?? [],
    createdAt: (data.createdAt as Timestamp).toMillis(),
  };
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function fetchLinks(userId: string): Promise<SavedLink[]> {
  const q = query(getLinksRef(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToLink(d.id, d.data() as Record<string, unknown>),
  );
}

export async function addLink(
  userId: string,
  url: string,
  title?: string,
): Promise<SavedLink> {
  const now = Date.now();
  const finalTitle = title?.trim() || extractDomain(url);

  const docRef = await addDoc(getLinksRef(userId), {
    url,
    title: finalTitle,
    tags: [],
    createdAt: Timestamp.fromMillis(now),
  });

  return { id: docRef.id, url, title: finalTitle, tags: [], createdAt: now };
}

export async function updateLinkTags(
  userId: string,
  linkId: string,
  tags: string[],
): Promise<void> {
  const ref = linkDocRef(userId, linkId);
  await updateDoc(ref, { tags });
}

export async function deleteLink(
  userId: string,
  linkId: string,
): Promise<void> {
  await deleteDoc(linkDocRef(userId, linkId));
}
