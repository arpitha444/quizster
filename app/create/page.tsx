"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { PdfDropzone } from "@/components/PdfDropzone";
import { useAuth } from "@/lib/auth-context";
import { saveQuiz } from "@/lib/rooms";
import type { QuizQuestion } from "@/lib/types";

export default function CreatePage() {
  return (
    <AuthGuard>
      <CreateInner />
    </AuthGuard>
  );
}

function CreateInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!file || !user) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("count", String(count));
      const response = await fetch("/api/generate", { method: "POST", body });
      const payload = (await response.json()) as {
        title?: string;
        questions?: QuizQuestion[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Generation failed.");
      }
      const quizId = await saveQuiz(user.uid, payload.title || "Quizster Quiz", payload.questions || []);
      router.push(`/quiz/${quizId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a quiz.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-midnight">Make a quiz from a PDF</h1>
        <p className="mt-2 font-semibold text-midnight/70">
          Gemini Flash reads your notes and writes a mixed set of questions.
        </p>
      </div>
      <PdfDropzone file={file} onFile={setFile} />
      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <label className="font-extrabold text-midnight">
          Number of questions: {count}
          <input
            type="range"
            min={5}
            max={15}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="mt-3 w-full accent-french"
          />
        </label>
        {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}
        <Button className="mt-4" disabled={!file || busy} onClick={() => void generate()}>
          {busy ? "Reading your PDF…" : "Generate quiz"}
        </Button>
      </div>
    </div>
  );
}
