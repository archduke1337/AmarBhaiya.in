"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type Question = {
  id: string;
  text: string;
  type: string;
  options: string[];
};

type QuizFormProps = {
  quizId: string;
  quizTitle: string;
  passMark: number;
  timeLimit: number;
  questions: Question[];
  submitAction: (formData: FormData) => Promise<void>;
};

export function QuizForm({
  quizId,
  quizTitle,
  passMark,
  timeLimit,
  questions,
  submitAction,
}: QuizFormProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">{quizTitle}</h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{questions.length} questions</span>
          <span>Pass mark: {passMark}%</span>
          {timeLimit > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {timeLimit} min
            </span>
          )}
        </div>
      </div>

      <form
        action={async (formData) => {
          setSubmitted(true);
          await submitAction(formData);
        }}
        className="flex flex-col gap-5"
      >
        <input type="hidden" name="quizId" value={quizId} />

        {questions.map((q, i) => (
          <fieldset
            key={q.id}
            disabled={submitted}
            className="border border-border p-5 space-y-3"
          >
            <legend className="text-xs uppercase tracking-widest text-muted-foreground px-2">
              Question {i + 1}
            </legend>
            <p className="text-sm font-medium">{q.text}</p>

            {q.type === "true_false" ? (
              <div className="flex gap-4">
                {["True", "False"].map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value={opt}
                      required
                      className="size-4 accent-foreground"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : q.type === "short_answer" ? (
              <input
                type="text"
                name={`answer_${q.id}`}
                required
                placeholder="Your answer..."
                className="h-10 w-full border border-border bg-background px-3 text-sm"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value={opt}
                      required
                      className="size-4 accent-foreground"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ))}

        <button
          type="submit"
          disabled={submitted}
          className="h-11 bg-foreground px-6 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-50 self-start"
        >
          {submitted ? "Submitting..." : "Submit Quiz"}
        </button>
      </form>
    </div>
  );
}

// Result display after submission
export function QuizResult({
  score,
  passed,
  passMark,
  courseId,
}: {
  score: number;
  passed: boolean;
  passMark: number;
  courseId: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 border border-border">
      {passed ? (
        <CheckCircle className="size-12 text-emerald-500" />
      ) : (
        <XCircle className="size-12 text-destructive" />
      )}

      <h2 className="text-2xl font-medium">
        {passed ? "Congratulations!" : "Not quite there"}
      </h2>

      <div className="text-center">
        <p className="text-4xl font-bold tabular-nums">{score}%</p>
        <p className="text-sm text-muted-foreground mt-1">
          {passed
            ? `You passed! (Pass mark: ${passMark}%)`
            : `You needed ${passMark}% to pass. Try again!`}
        </p>
      </div>
    </div>
  );
}
