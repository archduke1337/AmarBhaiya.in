import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import {
  getQuizWithQuestions,
  submitQuizAttemptAction,
  getUserBestAttempt,
} from "@/actions/quiz";
import { QuizForm, QuizResult } from "@/components/quiz-form";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function TakeQuizPage({ params }: PageProps) {
  const user = await requireAuth();
  const { quizId } = await params;

  const { quiz, questions } = await getQuizWithQuestions(quizId);

  if (!quiz) {
    notFound();
  }

  // Check for previous best attempt
  const bestAttempt = await getUserBestAttempt(quizId);

  // Strip correct answers from questions sent to client
  const clientQuestions = questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: q.options,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href={quiz.courseId ? `/app/courses/${quiz.courseId}` : "/app/courses"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-4" />
        Back to course
      </Link>

      {/* Show previous result if exists */}
      {bestAttempt && (
        <QuizResult
          score={bestAttempt.score}
          passed={bestAttempt.passed}
          passMark={quiz.passMark}
          courseId={quiz.courseId}
        />
      )}

      {/* Quiz form — always show so they can retake */}
      <QuizForm
        quizId={quiz.id}
        quizTitle={quiz.title}
        passMark={quiz.passMark}
        timeLimit={quiz.timeLimit}
        questions={clientQuestions}
        submitAction={submitQuizAttemptAction}
      />
    </div>
  );
}
