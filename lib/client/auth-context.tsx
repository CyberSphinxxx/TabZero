"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

const CLASSROOM_SCOPE =
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** The Google OAuth access token, if available */
  googleToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Try to get a fresh access token (includes Classroom scope if requested)
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult();
          // The access_token isn't available via getIdTokenResult in Firebase v9+
          // We'll get it from re-authentication with scopes instead.
          // For now store the token hint — the actual Classroom fetch will
          // request a token via GAPI if available.
        } catch {
          // Token not available
        }
      } else {
        setGoogleToken(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();

    // Request Classroom read-only scope for assignment syncing
    provider.addScope(CLASSROOM_SCOPE);

    const result = await signInWithPopup(auth, provider);

    // Grab the access token if Google returned one with the requested scopes
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setGoogleToken(credential.accessToken);
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setGoogleToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, googleToken, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
