"use client";

import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb } from "./firebase";
import type { PlayerDoc, QuizDoc, RoomDoc } from "./types";

export function useRoomByCode(code: string | undefined) {
  const [room, setRoom] = useState<(RoomDoc & { id: string }) | null>(null);
  const [players, setPlayers] = useState<(PlayerDoc & { id: string })[]>([]);
  const [quiz, setQuiz] = useState<(QuizDoc & { id: string }) | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    const roomsQuery = query(collection(getFirebaseDb(), "rooms"), where("code", "==", code.toUpperCase()));
    const unsubRoom = onSnapshot(
      roomsQuery,
      (snap) => {
        const item = snap.docs[0];
        if (!item) {
          setError("Room not found.");
          setRoom(null);
          setLoading(false);
          return;
        }
        setRoom({ id: item.id, ...(item.data() as RoomDoc) });
        setError("");
        setLoading(false);
      },
      () => {
        setError("Could not load room.");
        setLoading(false);
      },
    );
    return () => unsubRoom();
  }, [code]);

  useEffect(() => {
    if (!room) return;
    const unsubPlayers = onSnapshot(collection(getFirebaseDb(), "rooms", room.id, "players"), (snap) => {
      setPlayers(snap.docs.map((item) => ({ id: item.id, ...(item.data() as PlayerDoc) })));
    });
    return () => unsubPlayers();
  }, [room]);

  useEffect(() => {
    if (!room?.quizId) return;
    const unsubQuiz = onSnapshot(doc(getFirebaseDb(), "quizzes", room.quizId), (snap) => {
      if (!snap.exists()) {
        setQuiz(null);
        return;
      }
      setQuiz({ id: snap.id, ...(snap.data() as QuizDoc) });
    });
    return () => unsubQuiz();
  }, [room?.quizId]);

  return { room, players, quiz, error, loading };
}
