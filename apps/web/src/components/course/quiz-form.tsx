"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { ActionResult } from "@/lib/errors/action-result";

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
  submitAction: (formData: FormData) => Promise<ActionResult>;
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
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-[clamp(1.5rem,4vw,2.25rem)] font-normal leading-tight tracking-[-0.02em]">{quizTitle}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
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
            className="space-y-3 rounded-2xl border border-border/40 bg-surface p-5 shadow-[var(--surface-shadow)] disabled:opacity-60"
          >
            <legend id={`question-${q.id}`} className="px-1 text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
              Question {i + 1}
            </legend>
            <p className="font-heading text-base font-normal leading-6 tracking-[-0.01em]" aria-hidden="true">{q.text}</p>

            {q.type === "true_false" ? (
              <div className="flex gap-4" role="group" aria-labelledby={`question-${q.id}`}>
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
                      aria-label={`Answer: ${opt}`}
                      className="size-4 accent-[var(--accent)]"
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
                aria-label="Short answer input"
                className="input-field h-10 w-full text-sm"
              />
            ) : (
              <div className="flex flex-col gap-2" role="group" aria-labelledby={`question-${q.id}`} aria-describedby={`question-${q.id}`}>
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
                      aria-label={`Option: ${opt}`}
                      className="size-4 accent-[var(--accent)]"
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
          aria-label="Submit quiz answers"
          aria-busy={submitted}
          className="inline-flex min-h-11 w-fit items-center justify-center self-start rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
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
}: {
  score: number;
  passed: boolean;
  passMark: number;
  courseId?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-border/40 bg-surface px-6 py-12 text-center shadow-[var(--surface-shadow)]">
      <div className="flex size-16 items-center justify-center rounded-full bg-surface-hover">
        {passed ? (
          <CheckCircle className="size-9 text-success" />
        ) : (
          <XCircle className="size-9 text-destructive" />
        )}
      </div>

      <h2 className="font-heading text-[clamp(1.5rem,4vw,2.25rem)] font-normal leading-tight tracking-[-0.02em]">
        {passed ? "Congratulations!" : "Not quite there"}
      </h2>

      <div className="space-y-1">
        <p className="font-heading text-5xl font-normal tabular-nums tracking-[-0.02em]">{score}%</p>
        <p className="text-sm font-medium leading-6 text-muted-foreground">
          {passed
            ? `You passed! (Pass mark: ${passMark}%)`
            : `You needed ${passMark}% to pass. Try again!`}
        </p>
      </div>
    </div>
  );
}
