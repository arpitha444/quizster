import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { isAnswerCorrect } from "./scoring";
import type { AvatarId } from "./avatars";
import type { QuizQuestion, UserProfile } from "./types";

export function getDefaultProfile(uid: string, displayName = "Player", email = ""): UserProfile {
  return {
    uid,
    displayName: displayName || "Player",
    email,
    bio: "",
    avatarId: "yellow" as AvatarId,
    correctStreak: 0,
    bestCorrectStreak: 0,
    groupWinStreak: 0,
    bestGroupWinStreak: 0,
    totalGroupWins: 0,
    totalQuizzesPlayed: 0,
    processedRooms: [],
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      uid,
      displayName: data.displayName || "Player",
      email: data.email || "",
      bio: typeof data.bio === "string" ? data.bio : "",
      avatarId: (data.avatarId as AvatarId) || "yellow",
      correctStreak: typeof data.correctStreak === "number" ? data.correctStreak : 0,
      bestCorrectStreak: typeof data.bestCorrectStreak === "number" ? data.bestCorrectStreak : 0,
      groupWinStreak: typeof data.groupWinStreak === "number" ? data.groupWinStreak : 0,
      bestGroupWinStreak: typeof data.bestGroupWinStreak === "number" ? data.bestGroupWinStreak : 0,
      totalGroupWins: typeof data.totalGroupWins === "number" ? data.totalGroupWins : 0,
      totalQuizzesPlayed: typeof data.totalQuizzesPlayed === "number" ? data.totalQuizzesPlayed : 0,
      processedRooms: Array.isArray(data.processedRooms) ? data.processedRooms : [],
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    };
  } catch (err) {
    console.warn("Could not fetch user profile for uid:", uid, err);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  payload: {
    displayName?: string;
    bio?: string;
    avatarId?: AvatarId;
  },
): Promise<void> {
  const ref = doc(getFirebaseDb(), "users", uid);
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function recordQuizSubmission(params: {
  uid: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
}): Promise<{ currentStreak: number; bestStreak: number }> {
  const current = (await getUserProfile(params.uid)) ?? getDefaultProfile(params.uid);
  let streak = current.correctStreak;
  let bestStreak = current.bestCorrectStreak;

  for (const question of params.questions) {
    const answered = params.answers[question.id] ?? "";
    const isCorrect = isAnswerCorrect(question.type, question.answer, answered);
    if (isCorrect) {
      streak += 1;
      if (streak > bestStreak) {
        bestStreak = streak;
      }
    } else {
      streak = 0;
    }
  }

  const totalQuizzes = (current.totalQuizzesPlayed || 0) + 1;

  try {
    await updateDoc(doc(getFirebaseDb(), "users", params.uid), {
      correctStreak: streak,
      bestCorrectStreak: bestStreak,
      totalQuizzesPlayed: totalQuizzes,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("Could not update correct streak for user:", err);
  }

  return { currentStreak: streak, bestStreak };
}

export async function recordGroupQuizFinish(params: {
  uid: string;
  roomId: string;
  rank: number;
  totalPlayers: number;
}): Promise<void> {
  // Only evaluate group quizzes with 2 or more participants
  if (params.totalPlayers < 2) return;

  const current = (await getUserProfile(params.uid)) ?? getDefaultProfile(params.uid);

  // Avoid recording the same room outcome multiple times
  const processed = new Set(current.processedRooms ?? []);
  if (processed.has(params.roomId)) {
    return;
  }
  processed.add(params.roomId);

  const won = params.rank === 1;
  const newWinStreak = won ? (current.groupWinStreak || 0) + 1 : 0;
  const newBestWinStreak = Math.max(current.bestGroupWinStreak || 0, newWinStreak);
  const newTotalWins = won ? (current.totalGroupWins || 0) + 1 : current.totalGroupWins || 0;

  try {
    await updateDoc(doc(getFirebaseDb(), "users", params.uid), {
      groupWinStreak: newWinStreak,
      bestGroupWinStreak: newBestWinStreak,
      totalGroupWins: newTotalWins,
      processedRooms: Array.from(processed).slice(-50), // retain last 50 room IDs
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("Could not record group quiz finish for user:", err);
  }
}
