import Link from "next/link";
import { notFound } from "next/navigation";
import { Film, Layers, PlaySquare, ShieldCheck } from "lucide-react";

import {
  createCurriculumLessonAction,
  createCurriculumModuleAction,
  updateCurriculumLessonAction,
  updateCurriculumModuleAction,
} from "@/actions/operations";
import { deleteModuleAction, deleteLessonAction } from "@/actions/delete";
import {
  createQuizAction,
  addQuizQuestionAction,
  getCourseQuizzes,
  deleteQuizAction,
} from "@/actions/quiz";
import {
  createAssignmentAction,
  getCourseAssignments,
  deleteAssignmentAction,
} from "@/actions/assignments";
import { PageHeader, StatCard, StatGrid } from "@/components/dashboard";
import { LessonVideoUploadForm } from "@/components/instructor/lesson-video-upload-form";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseSummary,
  getInstructorCurriculum,
} from "@/lib/appwrite/dashboard-data";
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
        <section className="border border-border p-5 space-y-3">
          <h2 className="text-lg font-medium">Curriculum Health</h2>
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

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Create module</h2>
        <form action={createCurriculumModuleAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm">
            <span>Module title</span>
            <input
              name="title"
              required
              minLength={4}
              placeholder="Module 1 - Foundations"
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm md:max-w-xs">
            <span>Order</span>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={0}
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span>Description</span>
            <textarea
              name="description"
              rows={2}
              placeholder="What this module covers"
              className="w-full border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="h-10 px-4 bg-foreground text-background text-sm"
            >
              Add module
            </button>
          </div>
        </form>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        {modules.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground lg:col-span-2">
            No modules found for this course yet.
          </article>
        ) : null}

        {modules.map((module) => (
          <article key={module.id} className="border border-border p-5 space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Module {module.order}
            </p>

            <form action={updateCurriculumModuleAction} className="grid gap-3">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />

              <label className="space-y-1 text-sm">
                <span>Module title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  defaultValue={module.title}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={module.description}
                  className="w-full border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm md:max-w-xs">
                <span>Order</span>
                <input
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={module.order}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-9 px-3 border border-border text-sm hover:bg-muted"
                >
                  Update module
                </button>
              </div>
            </form>
            <div className="flex items-center px-1">
              <form action={deleteModuleAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="moduleId" value={module.id} />
                <button
                  type="submit"
                  className="h-9 px-3 border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Delete module
                </button>
              </form>
            </div>

            <form action={createCurriculumLessonAction} className="border border-border p-4 space-y-3">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />

              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Add lesson</h3>

              <label className="space-y-1 text-sm block">
                <span>Lesson title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  placeholder="Lesson title"
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm block">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional lesson summary"
                  className="w-full border border-border bg-background px-3 py-2"
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
                    className="h-10 w-full border border-border bg-background px-3"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Order</span>
                  <input
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={module.lessons.length + 1}
                    className="h-10 w-full border border-border bg-background px-3"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFree" defaultChecked />
                Free lesson
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFreePreview" />
                Free preview (demo for paid courses)
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-9 px-3 bg-foreground text-background text-sm"
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
                <li key={lesson.id} className="border border-border p-3 space-y-3">
                  <p className="text-xs uppercase tracking-widest">
                    Lesson {lesson.order} · {formatDuration(lesson.duration)}
                    {lesson.isFree ? " · Free" : ""}
                    {lesson.isFreePreview ? " · Preview" : ""}
                    {lesson.videoFileId
                      ? " · ✓ Video"
                      : " · No video"}
                  </p>

                  {/* Video upload */}
                  <LessonVideoUploadForm
                    courseId={course.id}
                    lessonId={lesson.id}
                  />

                  <form action={updateCurriculumLessonAction} className="grid gap-3">
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
                        className="h-10 w-full border border-border bg-background px-3"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span>Description</span>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={lesson.description}
                        className="w-full border border-border bg-background px-3 py-2"
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
                          className="h-10 w-full border border-border bg-background px-3"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span>Order</span>
                        <input
                          name="order"
                          type="number"
                          min={0}
                          defaultValue={lesson.order}
                          className="h-10 w-full border border-border bg-background px-3"
                        />
                      </label>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" name="isFree" defaultChecked={lesson.isFree} />
                      Free lesson
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" name="isFreePreview" defaultChecked={lesson.isFreePreview} />
                      Free preview (demo for paid courses)
                    </label>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="h-9 px-3 border border-border text-sm hover:bg-muted"
                      >
                        Save lesson
                      </button>
                    </div>
                  </form>
                  <div className="flex items-center pt-2">
                    <form action={deleteLessonAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <button
                        type="submit"
                        className="h-9 px-3 border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
      <section className="border border-border p-6 space-y-6">
        <h2 className="text-xl">Course Quizzes ({quizzes.length})</h2>

        {/* Create quiz form */}
        <form action={createQuizAction} className="grid gap-3 md:grid-cols-4 border border-border p-4">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">Quiz title</span>
            <input
              name="title"
              required
              minLength={3}
              placeholder="e.g. Module 1 Assessment"
              className="h-10 w-full border border-border bg-background px-3 text-sm"
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
              className="h-10 w-full border border-border bg-background px-3 text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-10 w-full bg-foreground text-background text-sm transition-opacity hover:opacity-90"
            >
              Create Quiz
            </button>
          </div>
        </form>

        {/* Existing quizzes */}
        {quizzes.map((quiz) => (
          <article key={quiz.id} className="border border-border">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="text-sm font-medium">{quiz.title}</h3>
                <p className="text-[10px] text-muted-foreground">
                  Pass mark: {quiz.passMark}% · Time limit: {quiz.timeLimit || "None"}
                </p>
              </div>
              <form action={deleteQuizAction}>
                <input type="hidden" name="quizId" value={quiz.id} />
                <button
                  type="submit"
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>

            {/* Add question form */}
            <form
              action={addQuizQuestionAction}
              className="grid gap-3 p-5 md:grid-cols-2"
            >
              <input type="hidden" name="quizId" value={quiz.id} />

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Question text</span>
                <input
                  name="text"
                  required
                  placeholder="What is...?"
                  className="h-9 w-full border border-border bg-background px-3 text-xs"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Type</span>
                <select
                  name="type"
                  className="h-9 w-full border border-border bg-background px-3 text-xs"
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
                  className="h-9 w-full border border-border bg-background px-3 text-xs"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Options (comma-separated, for MCQ)</span>
                <input
                  name="options"
                  placeholder="Option A, Option B, Option C, Option D"
                  className="h-9 w-full border border-border bg-background px-3 text-xs"
                />
              </label>

              <div className="flex items-end md:col-span-2 justify-end">
                <button
                  type="submit"
                  className="h-9 border border-border px-4 text-xs hover:bg-muted transition-colors"
                >
                  Add Question
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>

      {/* Assignment Management */}
      <section className="border border-border p-6 space-y-6">
        <h2 className="text-xl">Assignments ({assignments.length})</h2>

        <form action={createAssignmentAction} className="grid gap-3 md:grid-cols-2 border border-border p-4">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Title</span>
            <input
              name="title"
              required
              minLength={3}
              placeholder="e.g. Build a REST API"
              className="h-10 w-full border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Due date (optional)</span>
            <input
              name="dueDate"
              type="date"
              className="h-10 w-full border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">Description / Instructions</span>
            <textarea
              name="description"
              rows={3}
              placeholder="What should the student do? Include requirements and deliverables."
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end md:col-span-2 justify-end">
            <button
              type="submit"
              className="h-10 bg-foreground text-background px-6 text-sm transition-opacity hover:opacity-90"
            >
              Create Assignment
            </button>
          </div>
        </form>

        {assignments.map((a) => (
          <article key={a.id} className="border border-border">
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h3 className="text-sm font-medium">{a.title}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {a.dueDate ? `Due: ${a.dueDate}` : "No deadline"}
                </p>
              </div>
              <form action={deleteAssignmentAction}>
                <input type="hidden" name="assignmentId" value={a.id} />
                <button
                  type="submit"
                  className="text-xs text-destructive hover:underline"
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
