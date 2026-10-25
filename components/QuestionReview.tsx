"use client";

import { useMemo, useState } from "react";
import { downloadQuizPdf } from "@/lib/pdf-generator";
import { isAnswerCorrect } from "@/lib/scoring";
import type { QuizQuestion } from "@/lib/types";

type Props = {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  quizTitle?: string;
  playerName?: string;
};

export function QuestionReview({ questions, answers, quizTitle, playerName }: Props) {
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");

  const results = useMemo(() => {
    return questions.map((question, index) => {
      const userAnswer = answers[question.id] ?? "";
      const isCorrect = isAnswerCorrect(question.type, question.answer, userAnswer);
      return {
        question,
        index,
        userAnswer,
        isCorrect,
        points: isCorrect ? 100 : 0,
      };
    });
  }, [questions, answers]);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.length - correctCount;
  const totalScore = correctCount * 100;
  const maxScore = results.length * 100;
  const percentage = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === "correct") return results.filter((r) => r.isCorrect);
    if (filter === "incorrect") return results.filter((r) => !r.isCorrect);
    return results;
  }, [filter, results]);

  if (questions.length === 0) return null;

  function handleDownloadPdf() {
    downloadQuizPdf({
      quizTitle: quizTitle || "Quizster Quiz",
      playerName: playerName || "Player",
      questions,
      answers,
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary Stat Card */}
      <div className="rounded-[1.75rem] sm:rounded-[2rem] bg-white p-4 sm:p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-french">Performance Breakdown</p>
            <h2 className="text-xl sm:text-2xl font-black text-midnight">Question-by-Question Review</h2>
            <p className="text-xs sm:text-sm font-semibold text-midnight/70">
              See where you gained points and where you missed them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-initial rounded-xl sm:rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2 text-center">
              <p className="text-[10px] sm:text-xs font-black uppercase text-emerald-700">Score</p>
              <p className="text-lg sm:text-xl font-black text-emerald-800">
                {totalScore} <span className="text-[10px] sm:text-xs font-bold text-emerald-600">/ {maxScore}</span>
              </p>
            </div>
            <div className="flex-1 sm:flex-initial rounded-xl sm:rounded-2xl border-2 border-midnight/10 bg-seashell px-3 sm:px-4 py-2 text-center">
              <p className="text-[10px] sm:text-xs font-black uppercase text-midnight/60">Accuracy</p>
              <p className="text-lg sm:text-xl font-black text-midnight">{percentage}%</p>
            </div>
          </div>
        </div>

        {/* Filter Chips & Download PDF Button */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-seashell pt-3 sm:pt-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-black uppercase text-midnight/50">Filter:</span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-extrabold transition ${
                filter === "all"
                  ? "bg-midnight text-white shadow-sm"
                  : "bg-seashell text-midnight/70 hover:bg-wheat"
              }`}
            >
              All ({results.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("correct")}
              className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-extrabold transition ${
                filter === "correct"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              ✓ Correct ({correctCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("incorrect")}
              className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-extrabold transition ${
                filter === "incorrect"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              ✗ Missed ({incorrectCount})
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-french/25 bg-french/5 px-3.5 py-1.5 text-xs font-black text-french hover:bg-french hover:text-white transition active:scale-95 cursor-pointer shadow-xs"
            title="Download full quiz study guide as a PDF"
          >
            <span>📥</span>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Question Review Cards */}
      <div className="space-y-3.5 sm:space-y-4">
        {filtered.map(({ question, index, userAnswer, isCorrect, points }) => {
          const typeLabel =
            question.type === "mcq"
              ? "Multiple choice"
              : question.type === "tf"
              ? "True / False"
              : "Fill in the blank";

          return (
            <div
              key={question.id}
              className={`rounded-[1.5rem] sm:rounded-[1.75rem] bg-white p-4 sm:p-6 shadow-card border-2 transition ${
                isCorrect ? "border-emerald-200" : "border-rose-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="rounded-full bg-seashell px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black text-midnight/80">
                    Question #{index + 1}
                  </span>
                  <span className="rounded-full bg-wheat px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-extrabold text-midnight">
                    {typeLabel}
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1 text-[11px] sm:text-xs font-black ${
                    isCorrect
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <span>✓ Correct</span>
                      <span>·</span>
                      <span>+{points} pts</span>
                    </>
                  ) : (
                    <>
                      <span>✗ Incorrect</span>
                      <span>·</span>
                      <span>+0 pts (lost 100)</span>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-3 sm:mt-4 text-sm sm:text-base font-black text-midnight leading-snug">{question.prompt}</p>

              {/* Multiple Choice / True-False Options */}
              {question.options && question.options.length > 0 ? (
                <div className="mt-3 sm:mt-4 grid gap-2 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const isChosen = userAnswer === option;
                    const isTheCorrectAnswer = option === question.answer;

                    let badge = null;
                    let style = "border-2 border-transparent bg-seashell text-midnight/75";

                    if (isChosen && isTheCorrectAnswer) {
                      style = "border-2 border-emerald-500 bg-emerald-50 font-black text-emerald-900";
                      badge = (
                        <span className="shrink-0 whitespace-nowrap self-start sm:self-center rounded-full bg-emerald-600 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-white shadow-xs">
                          ✓ Your Answer (Correct)
                        </span>
                      );
                    } else if (isChosen && !isTheCorrectAnswer) {
                      style = "border-2 border-rose-400 bg-rose-50 font-bold text-rose-900";
                      badge = (
                        <span className="shrink-0 whitespace-nowrap self-start sm:self-center rounded-full bg-rose-600 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-white shadow-xs">
                          ✗ Your Answer
                        </span>
                      );
                    } else if (isTheCorrectAnswer) {
                      style = "border-2 border-emerald-400 bg-emerald-50/70 font-bold text-emerald-900";
                      badge = (
                        <span className="shrink-0 whitespace-nowrap self-start sm:self-center rounded-full bg-emerald-500 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-white shadow-xs">
                          ✓ Correct Answer
                        </span>
                      );
                    }

                    return (
                      <div
                        key={option}
                        className={`flex items-start sm:items-center justify-between gap-2 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm ${style}`}
                      >
                        <span className="min-w-0 flex-1 break-words font-bold sm:font-extrabold leading-snug">
                          {option}
                        </span>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Fill in the Blank Review */
                <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <div
                    className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 text-xs sm:text-sm ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-950"
                        : "border-rose-300 bg-rose-50 text-rose-950"
                    }`}
                  >
                    <p className="text-[10px] sm:text-xs font-black uppercase text-midnight/60">Your Answer</p>
                    <p className="mt-1 font-black text-sm sm:text-base break-words">
                      {userAnswer ? `"${userAnswer}"` : <span className="italic text-midnight/40">(Left blank)</span>}
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3 sm:p-4 text-xs sm:text-sm text-emerald-950">
                    <p className="text-[10px] sm:text-xs font-black uppercase text-emerald-700">Correct Answer</p>
                    <p className="mt-1 font-black text-sm sm:text-base break-words">&quot;{question.answer}&quot;</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
