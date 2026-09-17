export type QuestionType = "mcq" | "tf" | "blank";

export type QuizQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer: string;
};

export type QuizDoc = {
  ownerId: string;
  title: string;
  questionCount: number;
  questions: QuizQuestion[];
  createdAt: number;
};

export type RoomStatus = "lobby" | "playing" | "finished";

export type RoomDoc = {
  code: string;
  hostId: string;
  quizId: string;
  title: string;
  status: RoomStatus;
  startedAt: number | null;
  createdAt: number;
  solo?: boolean;
};

export type PlayerDoc = {
  displayName: string;
  joinedAt: number;
  isHost: boolean;
  answers?: Record<string, string>;
  score?: number;
  finishedAt?: number | null;
};
