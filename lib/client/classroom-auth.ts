/**
 * Dead-simple Classroom token management using Firebase Auth's built-in
 * multi-account support (via signInWithPopup with additional scopes).
 *
 * The token is stored in localStorage and fetched independently from the
 * main AuthContext so the user can link a different Google account.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

const CLASSROOM_SCOPE =
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly";

const STORAGE_KEY = "tabzero:classroom-token";

export function getStoredClassroomToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function clearStoredClassroomToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Opens a Google sign-in popup that requests the Classroom scope.
 *
 * This uses Firebase Auth so it works out of the box — no GCP client ID
 * needed in .env.local. The user can pick *any* Google account in the popup,
 * including a different (school) email than their main TabZero login.
 *
 * The resulting access token is stored in localStorage so the Classroom
 * widget can use it to call the Classroom REST API directly.
 */
export async function connectClassroom(): Promise<string> {
  const auth: Auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope(CLASSROOM_SCOPE);

  // Force account selection so the user can pick their school email
  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error("No access token received from Google.");
  }

  localStorage.setItem(STORAGE_KEY, credential.accessToken);
  return credential.accessToken;
}
