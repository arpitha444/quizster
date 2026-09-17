export function normalizeBlank(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function isAnswerCorrect(type: "mcq" | "tf" | "blank", expected: string, given: string): boolean {
  if (type === "blank") {
    return normalizeBlank(given) === normalizeBlank(expected);
  }
  return given.trim() === expected.trim();
}

export function scoreQuiz(
  questions: { id: string; type: "mcq" | "tf" | "blank"; answer: string }[],
  answers: Record<string, string>,
): { score: number; correctCount: number } {
  let correctCount = 0;
  for (const question of questions) {
    if (isAnswerCorrect(question.type, question.answer, answers[question.id] ?? "")) {
      correctCount += 1;
    }
  }
  return { score: correctCount * 100, correctCount };
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function rankPlayers<T extends { score?: number; finishedAt?: number | null }>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const scoreDiff = (b.score ?? -1) - (a.score ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    const aTime = a.finishedAt ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.finishedAt ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}
