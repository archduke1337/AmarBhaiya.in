import Link from "next/link";
import { notFound } from "next/navigation";
import { Film, Layers, PlaySquare, ShieldCheck } from "lucide-react";

import {
  createCurriculumModuleFormAction,
  createCurriculumLessonFormAction,
  updateCurriculumModuleFormAction,
  updateCurriculumLessonFormAction,
  createQuizFormAction,
  addQuizQuestionFormAction,
  deleteQuizFormAction,
  createAssignmentFormAction,
  deleteAssignmentFormAction,
} from "@/server/actions/form-wrappers";
import { deleteModuleFormAction, deleteLessonFormAction } from "@/server/actions/form-wrappers";
import {
  getCourseQuizzes,
} from "@/server/actions/quiz";
import {
  getCourseAssignments,
} from "@/server/actions/assignments";
import { PageHeader, StatCard, StatGrid } from "@/components/dashboard";
import { LessonVideoUploadForm } from "@/components/instructor/lesson-video-upload-form";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/server/appwrite/auth";
import {
  getInstructorCourseSummary,
  getInstructorCurriculum,
} from "@/server/appwrite/dashboard-data";
import { formatDuration } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCurriculumPage({ params }: PageProps) {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const { id } = await params;
  const course = await getInstructorCourseSummary({ userId: user.$id, role }, id);

  if (!course) {
    notFound();
  }

  const [modules, quizzes, assignments] = await Promise.all([
    getInstructorCurriculum(course.id),
    getCourseQuizzes(course.id),
    getCourseAssignments(course.id),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        eyebrow="Curriculum Builder"
        title={`Curriculum for ${course.title}`}
        description="Build modules, lessons, quizzes, assignments, and the first-wave media students need."
        actions={
          <Link
            href={`/instructor/courses/${course.id}`}
            className="text-sm underline underline-offset-4"
          >
            Back to course details
          </Link>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Modules"
          value={course.moduleCount}
          icon={Layers}
          description={`${course.totalLessons} lessons total`}
        />
        <StatCard
          label="Lesson Videos"
          value={course.lessonVideoCount}
          icon={Film}
          description={
            course.missingVideoCount > 0
              ? `${course.missingVideoCount} lessons still need video`
              : "Every lesson has video"
          }
        />
        <StatCard
          label="Preview Lessons"
          value={course.previewLessonCount}
          icon={PlaySquare}
          description={
            course.accessModel === "free"
              ? "Optional for free courses"
              : "Useful for conversion"
          }
        />
        <StatCard
          label="Readiness"
          value={course.publishBlockers.length === 0 ? "On track" : "Blocked"}
          icon={ShieldCheck}
          description={
            course.publishBlockers.length === 0
              ? "Curriculum baseline is in place"
              : `${course.publishBlockers.length} blocker${course.publishBlockers.length === 1 ? "" : "s"} remaining`
          }
        />
      </StatGrid>

      {(course.publishBlockers.length > 0 || course.attentionFlags.length > 0) && (
        <section className="space-y-3 rounded-2xl border border-border/40 bg-surface p-5 shadow-[var(--surface-shadow)]">
          <h2 className="font-heading text-lg font-black tracking-[-0.03em]">Curriculum Health</h2>
          {course.publishBlockers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-destructive">
                Blocking issues
              </p>
              <div className="flex flex-wrap gap-2">
                {course.publishBlockers.map((blocker) => (
                  <Badge key={blocker} variant="destructive">
                    {blocker}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {course.attentionFlags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Watch list
              </p>
              <div className="flex flex-wrap gap-2">
                {course.attentionFlags.map((flag) => (
                  <Badge key={flag} variant="outline">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-border/40 bg-surface p-6 shadow-[var(--surface-shadow)]">
        <h2 className="font-heading text-xl font-black tracking-[-0.03em]">Create module</h2>
        <form action={createCurriculumModuleFormAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm">
            <span>Module title</span>
            <input
              name="title"
              required
              minLength={4}
              placeholder="Module 1 - Foundations"
              className="input-field h-10 w-full"
            />
          </label>

          <label className="space-y-1 text-sm md:max-w-xs">
            <span>Order</span>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={0}
              className="input-field h-10 w-full"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span>Description</span>
            <textarea
              name="description"
              rows={2}
              placeholder="What this module covers"
              className="input-field--textarea w-full"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
            >
              Add module
            </button>
          </div>
        </form>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        {modules.length === 0 ? (
          <article className="rounded-2xl border border-border/40 bg-surface p-5 text-sm font-medium text-muted-foreground lg:col-span-2">
            No modules found for this course yet.
          </article>
        ) : null}

        {modules.map((module) => (
          <article key={module.id} className="space-y-4 rounded-2xl border border-border/40 bg-surface p-5 shadow-[var(--surface-shadow)]">
            <p className="font-heading text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              Module {module.order}
            </p>

            <form action={updateCurriculumModuleFormAction} className="grid gap-3">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />

              <label className="space-y-1 text-sm">
                <span>Module title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  defaultValue={module.title}
                  className="input-field h-10 w-full"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={module.description}
                  className="input-field--textarea w-full"
                />
              </label>

              <label className="space-y-1 text-sm md:max-w-xs">
                <span>Order</span>
                <input
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={module.order}
                  className="input-field h-10 w-full"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-hover"
                >
                  Update module
                </button>
              </div>
            </form>
            <div className="flex items-center px-1">
              <form action={deleteModuleFormAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="moduleId" value={module.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border border-destructive/30 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete module
                </button>
              </form>
            </div>

            <form action={createCurriculumLessonFormAction} className="space-y-3 rounded-xl border border-border/40 bg-background p-4">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />

              <h3 className="font-heading text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Add lesson</h3>

              <label className="space-y-1 text-sm block">
                <span>Lesson title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  placeholder="Lesson title"
                  className="input-field h-10 w-full"
                />
              </label>

              <label className="space-y-1 text-sm block">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional lesson summary"
                  className="input-field--textarea w-full"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span>Duration (seconds)</span>
                  <input
                    name="durationSeconds"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="input-field h-10 w-full"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Order</span>
                  <input
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={module.lessons.length + 1}
                    className="input-field h-10 w-full"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" name="isFree" defaultChecked className="accent-[var(--accent)]" />
                Free lesson
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" name="isFreePreview" className="accent-[var(--accent)]" />
                Free preview (available for paid courses)
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
                >
                  Add lesson
                </button>
              </div>
            </form>

            {module.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
            ) : null}

            <ul className="space-y-3 text-sm text-muted-foreground">
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="space-y-3 rounded-xl border border-border/40 bg-background p-4">
                  <p className="font-heading text-xs font-black uppercase tracking-[0.14em]">
                    Lesson {lesson.order} · {formatDuration(lesson.duration)}
                    {lesson.isFree ? " · Free" : ""}
                    {lesson.isFreePreview ? " · Preview" : ""}
                    {lesson.videoFileId
                      ? " · Video"
                      : " · No video"}
                  </p>

                  {/* Video upload */}
                  <LessonVideoUploadForm
                    courseId={course.id}
                    lessonId={lesson.id}
                  />

                  <form action={updateCurriculumLessonFormAction} className="grid gap-3">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={module.id} />
                    <input type="hidden" name="lessonId" value={lesson.id} />

                    <label className="space-y-1 text-sm">
                      <span>Lesson title</span>
                      <input
                        name="title"
                        required
                        minLength={4}
                        defaultValue={lesson.title}
                        className="input-field h-10 w-full"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span>Description</span>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={lesson.description}
                        className="input-field--textarea w-full"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1 text-sm">
                        <span>Duration (seconds)</span>
                        <input
                          name="durationSeconds"
                          type="number"
                          min={0}
                          defaultValue={lesson.duration}
                          className="input-field h-10 w-full"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span>Order</span>
                        <input
                          name="order"
                          type="number"
                          min={0}
                          defaultValue={lesson.order}
                          className="input-field h-10 w-full"
                        />
                      </label>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" name="isFree" defaultChecked={lesson.isFree} className="accent-[var(--accent)]" />
                      Free lesson
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" name="isFreePreview" defaultChecked={lesson.isFreePreview} className="accent-[var(--accent)]" />
                      Free preview (available for paid courses)
                    </label>

                    <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-hover"
                >
                  Save lesson
                </button>
                    </div>
                  </form>
                  <div className="flex items-center pt-2">
                    <form action={deleteLessonFormAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border border-destructive/30 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Delete lesson
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* Quiz Management */}
      <section className="space-y-6 rounded-2xl border border-border/40 bg-surface p-6 shadow-[var(--surface-shadow)]">
        <h2 className="font-heading text-xl font-black tracking-[-0.03em]">Course Quizzes ({quizzes.length})</h2>

        {/* Create quiz form */}
        <form action={createQuizFormAction} className="grid gap-3 rounded-xl border border-border/40 bg-background p-4 md:grid-cols-4">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">Quiz title</span>
            <input
              name="title"
              required
              minLength={3}
              placeholder="e.g. Module 1 Assessment"
              className="input-field h-11 w-full"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Pass mark (%)</span>
            <input
              name="passMark"
              type="number"
              min={0}
              max={100}
              defaultValue={60}
              className="input-field h-11 w-full"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
            >
              Create Quiz
            </button>
          </div>
        </form>

        {/* Existing quizzes */}
        {quizzes.map((quiz) => (
          <article key={quiz.id} className="rounded-2xl border border-border/40 bg-surface shadow-[var(--surface-shadow)]">
            <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-3">
              <div>
                <h3 className="text-sm font-medium">{quiz.title}</h3>
                <p className="text-[10px] text-muted-foreground">
                  Pass mark: {quiz.passMark}% · Time limit: {quiz.timeLimit || "None"}
                </p>
              </div>
              <form action={deleteQuizFormAction}>
                <input type="hidden" name="quizId" value={quiz.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete
                </button>
              </form>
            </div>

            {/* Add question form */}
            <form
              action={addQuizQuestionFormAction}
              className="grid gap-3 p-5 md:grid-cols-2"
            >
              <input type="hidden" name="quizId" value={quiz.id} />

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Question text</span>
                <input
                  name="text"
                  required
                  placeholder="What is...?"
                  className="input-field h-11 w-full text-sm"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Type</span>
                <select
                  name="type"
                  className="input-field h-11 w-full text-sm"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Correct answer</span>
                <input
                  name="correctAnswer"
                  required
                  placeholder="The correct option text"
                  className="input-field h-11 w-full text-sm"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Options (comma-separated, for MCQ)</span>
                <input
                  name="options"
                  placeholder="Option A, Option B, Option C, Option D"
                  className="input-field h-11 w-full text-sm"
                />
              </label>

              <div className="flex items-end md:col-span-2 justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-[calc(var(--radius)+2px)] border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-hover"
                >
                  Add Question
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>

      {/* Assignment Management */}
      <section className="space-y-6 rounded-2xl border border-border/40 bg-surface p-6 shadow-[var(--surface-shadow)]">
        <h2 className="font-heading text-xl font-black tracking-[-0.03em]">Assignments ({assignments.length})</h2>

        <form action={createAssignmentFormAction} className="grid gap-3 rounded-xl border border-border/40 bg-background p-4 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Title</span>
            <input
              name="title"
              required
              minLength={3}
              placeholder="e.g. Build a REST API"
              className="input-field h-11 w-full"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Due date (optional)</span>
            <input
              name="dueDate"
              type="date"
              className="input-field h-11 w-full"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">Description / Instructions</span>
            <textarea
              name="description"
              rows={3}
              placeholder="What should the student do? Include requirements and deliverables."
              className="input-field--textarea w-full"
            />
          </label>

          <div className="flex items-end md:col-span-2 justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
            >
              Create Assignment
            </button>
          </div>
        </form>

        {assignments.map((a) => (
          <article key={a.id} className="rounded-2xl border border-border/40 bg-surface shadow-[var(--surface-shadow)]">
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <h3 className="text-sm font-medium">{a.title}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {a.dueDate ? `Due: ${a.dueDate}` : "No deadline"}
                </p>
              </div>
              <form action={deleteAssignmentFormAction}>
                <input type="hidden" name="assignmentId" value={a.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete
                </button>
              </form>
            </div>
            {a.description && (
              <div className="px-5 pb-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{a.description}</p>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
