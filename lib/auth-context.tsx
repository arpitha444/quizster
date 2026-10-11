"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "./firebase";
import type { AvatarId } from "./avatars";
import type { UserProfile } from "./types";
import { getDefaultProfile, updateUserProfile } from "./user-profile";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string, displayName: string, avatarId?: AvatarId) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: { displayName?: string; bio?: string; avatarId?: AvatarId }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function upsertUser(user: User, extra?: { displayName?: string; avatarId?: AvatarId }) {
  try {
    const userRef = doc(getFirebaseDb(), "users", user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        displayName: extra?.displayName || user.displayName || user.email?.split("@")[0] || "Player",
        bio: "",
        avatarId: extra?.avatarId || "yellow",
        correctStreak: 0,
        bestCorrectStreak: 0,
        groupWinStreak: 0,
        bestGroupWinStreak: 0,
        totalGroupWins: 0,
        totalQuizzesPlayed: 0,
        processedRooms: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      const data = existing.data();
      const updates: Record<string, unknown> = {
        updatedAt: Date.now(),
      };
      if (!data.avatarId) updates.avatarId = "yellow";
      if (typeof data.bio !== "string") updates.bio = "";
      if (typeof data.correctStreak !== "number") updates.correctStreak = 0;
      if (typeof data.bestCorrectStreak !== "number") updates.bestCorrectStreak = 0;
      if (typeof data.groupWinStreak !== "number") updates.groupWinStreak = 0;
      if (typeof data.bestGroupWinStreak !== "number") updates.bestGroupWinStreak = 0;
      if (typeof data.totalGroupWins !== "number") updates.totalGroupWins = 0;
      if (typeof data.totalQuizzesPlayed !== "number") updates.totalQuizzesPlayed = 0;
      if (extra?.displayName) updates.displayName = extra.displayName;
      await setDoc(userRef, updates, { merge: true });
    }
  } catch (err) {
    console.warn("Could not sync user profile to Firestore:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  useEffect(() => {
    if (!configured || !user) {
      setProfile(null);
      return;
    }
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            uid: user.uid,
            displayName: data.displayName || user.displayName || "Player",
            email: data.email || user.email || "",
            bio: typeof data.bio === "string" ? data.bio : "",
            avatarId: (data.avatarId as AvatarId) || "yellow",
            correctStreak: typeof data.correctStreak === "number" ? data.correctStreak : 0,
            bestCorrectStreak: typeof data.bestCorrectStreak === "number" ? data.bestCorrectStreak : 0,
            groupWinStreak: typeof data.groupWinStreak === "number" ? data.groupWinStreak : 0,
            bestGroupWinStreak: typeof data.bestGroupWinStreak === "number" ? data.bestGroupWinStreak : 0,
            totalGroupWins: typeof data.totalGroupWins === "number" ? data.totalGroupWins : 0,
            totalQuizzesPlayed: typeof data.totalQuizzesPlayed === "number" ? data.totalQuizzesPlayed : 0,
            processedRooms: Array.isArray(data.processedRooms) ? data.processedRooms : [],
            updatedAt: data.updatedAt,
          });
        } else {
          setProfile(getDefaultProfile(user.uid, user.displayName || undefined, user.email || undefined));
        }
      },
      (err) => {
        console.warn("Error listening to user profile:", err);
      },
    );
    return () => unsub();
  }, [configured, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured,
      async signUp(email, password, displayName, avatarId) {
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await updateProfile(credential.user, { displayName });
        await upsertUser(credential.user, { displayName, avatarId });
      },
      async signIn(email, password) {
        const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        await upsertUser(credential.user);
      },
      async signInGoogle() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const credential = await signInWithPopup(getFirebaseAuth(), provider);
        await upsertUser(credential.user);
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
      },
      async logout() {
        await signOut(getFirebaseAuth());
        setProfile(null);
      },
      async updateProfileData(data) {
        if (!user) return;
        await updateUserProfile(user.uid, data);
        if (data.displayName && data.displayName !== user.displayName) {
          await updateProfile(user, { displayName: data.displayName });
        }
      },
    }),
    [configured, loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function formatAuthError(err: unknown, fallback = "An error occurred."): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
    case "auth/unauthorized-domain":
      return "Domain not authorized in Firebase Console (Authentication > Settings > Authorized Domains).";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return err instanceof Error ? err.message : fallback;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
