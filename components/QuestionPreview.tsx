import type { QuizQuestion } from "@/lib/types";

export function QuestionPreview({ questions }: { questions: QuizQuestion[] }) {
  if (questions.length === 0) {
    return (
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-card">
        <p className="font-bold text-midnight/70">No questions yet. Generate a quiz from a PDF to see them here.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {questions.map((question, index) => (
        <li key={question.id} className="rounded-[1.75rem] bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-wheat px-3 py-1 text-xs font-extrabold uppercase text-midnight">
              {question.type === "mcq" ? "Multiple choice" : question.type === "tf" ? "True / False" : "Fill in the blank"}
            </span>
            <span className="text-sm font-bold text-powder">#{index + 1}</span>
          </div>
          <p className="font-extrabold text-midnight">{question.prompt}</p>
          {question.options ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => (
                <li
                  key={option}
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    option === question.answer ? "bg-wheat font-bold text-midnight" : "bg-seashell text-midnight/80"
                  }`}
                >
                  {option}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-midnight/70">
              Answer: <span className="font-bold text-french">{question.answer}</span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
