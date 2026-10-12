"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { QuizQuestion } from "@/lib/types";
import { Button } from "./Button";

type Props = {
  questions: QuizQuestion[];
  submitting?: boolean;
  onSubmit: (answers: Record<string, string>) => void;
};

export function QuizForm({ questions, submitting, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const remaining = useMemo(
    () => questions.filter((question) => !answers[question.id]?.trim()).length,
    [answers, questions],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (remaining > 0) return;
    onSubmit(answers);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {questions.map((question, index) => (
        <div key={question.id} className="rounded-[1.75rem] bg-white p-5 shadow-card">
          <div className="mb-3 flex w-full items-center justify-between gap-3">
            <span className="font-extrabold text-midnight">
              {index + 1}. {question.prompt}
            </span>
          </div>
          {question.type === "blank" ? (
            <input
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
              }
              className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold text-midnight outline-none focus:border-french"
              placeholder="Type your answer"
            />
          ) : (
            <div className="grid gap-2">
              {(question.options ?? []).map((option) => {
                const selected = answers[question.id] === option;
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold ${
                      selected ? "bg-wheat text-midnight" : "bg-seashell text-midnight/80"
                    }`}
                  >
                    <input
                      type="radio"
                      className="accent-french shrink-0 h-4 w-4"
                      name={question.id}
                      value={option}
                      checked={selected}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                    />
                    <span className="min-w-0 flex-1 break-words leading-snug">{option}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm font-bold text-midnight/70">
          {remaining === 0 ? "All questions answered — send it!" : `${remaining} left to answer`}
        </p>
        <Button type="submit" disabled={remaining > 0 || submitting}>
          {submitting ? "Submitting…" : "Submit quiz"}
        </Button>
      </div>
    </form>
  );
}
