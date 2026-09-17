import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { generateRoomCode } from "./scoring";
import type { PlayerDoc, QuizDoc, QuizQuestion, RoomDoc } from "./types";

export async function saveQuiz(ownerId: string, title: string, questions: QuizQuestion[]) {
  const ref = await addDoc(collection(getFirebaseDb(), "quizzes"), {
    ownerId,
    title,
    questionCount: questions.length,
    questions,
    createdAt: Date.now(),
  } satisfies QuizDoc);
  return ref.id;
}

export async function getQuiz(quizId: string) {
  const snap = await getDoc(doc(getFirebaseDb(), "quizzes", quizId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as QuizDoc) };
}

export async function listMyQuizzes(ownerId: string) {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "quizzes"), where("ownerId", "==", ownerId), limit(20)),
  );
  return snap.docs
    .map((item) => ({ id: item.id, ...(item.data() as QuizDoc) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function findRoomByCode(code: string) {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "rooms"), where("code", "==", code.toUpperCase()), limit(1)),
  );
  const item = snap.docs[0];
  if (!item) return null;
  return { id: item.id, ...(item.data() as RoomDoc) };
}

export async function createRoom(params: {
  hostId: string;
  quizId: string;
  title: string;
  solo?: boolean;
}) {
  const db = getFirebaseDb();
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await findRoomByCode(code);
    if (!existing) break;
    code = generateRoomCode();
  }

  const startedAt = params.solo ? Date.now() : null;
  const ref = await addDoc(collection(db, "rooms"), {
    code,
    hostId: params.hostId,
    quizId: params.quizId,
    title: params.title,
    status: params.solo ? "playing" : "lobby",
    startedAt,
    createdAt: Date.now(),
    solo: Boolean(params.solo),
  } satisfies RoomDoc);

  return { roomId: ref.id, code };
}

export async function joinRoom(roomId: string, uid: string, displayName: string, isHost: boolean) {
  await setDoc(
    doc(getFirebaseDb(), "rooms", roomId, "players", uid),
    {
      displayName,
      joinedAt: Date.now(),
      isHost,
      finishedAt: null,
    } satisfies PlayerDoc,
    { merge: true },
  );
}

export async function startRoom(roomId: string) {
  await updateDoc(doc(getFirebaseDb(), "rooms", roomId), {
    status: "playing",
    startedAt: Date.now(),
    hostStartedAt: serverTimestamp(),
  });
}

export async function submitRun(
  roomId: string,
  uid: string,
  payload: { answers: Record<string, string>; score: number },
) {
  await updateDoc(doc(getFirebaseDb(), "rooms", roomId, "players", uid), {
    answers: payload.answers,
    score: payload.score,
    finishedAt: Date.now(),
  });
}
