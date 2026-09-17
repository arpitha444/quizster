"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "./firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function upsertUser(user: User) {
  await setDoc(
    doc(getFirebaseDb(), "users", user.uid),
    {
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Player",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setLoading(false);
    });
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      async signUp(email, password, displayName) {
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await updateProfile(credential.user, { displayName });
        await upsertUser({ ...credential.user, displayName });
      },
      async signIn(email, password) {
        const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        await upsertUser(credential.user);
      },
      async signInGoogle() {
        const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
        await upsertUser(credential.user);
      },
      async logout() {
        await signOut(getFirebaseAuth());
      },
    }),
    [configured, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
