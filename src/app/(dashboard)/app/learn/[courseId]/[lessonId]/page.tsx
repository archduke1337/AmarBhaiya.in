import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, CheckCircle } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  getFileDownloadUrl,
  getFilePreviewUrl,
  getFileViewUrl,
} from "@/lib/utils/file-urls";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { getCourseProgress } from "@/actions/enrollment";
import { markLessonCompleteFormAction } from "@/actions/enrollment-form-wrapper";
import { postLessonCommentAction, getLessonComments } from "@/actions/comments";
import { Query } from "node-appwrite";

type AnyRow = Record<string, unknown> & { $id: string };

type PageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function LessonViewerPage({ params }: PageProps) {
  const user = await requireAuth();
  const { courseId, lessonId } = await params;

  const { tablesDB } = await createAdminClient();

  // Get lesson
  let lesson: AnyRow | null = null;
  try {
    lesson = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
    })) as AnyRow;
  } catch {
    notFound();
  }

  if (!lesson || String(lesson.courseId) !== courseId) {
    notFound();
  }

  // Get course
  let course: AnyRow | null = null;
  try {
    course = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    })) as AnyRow;
  } catch {
    notFound();
  }

  if (!course) notFound();
  const courseIsFree = String(course.accessModel ?? "free") === "free";

  const hasAccess = await userHasCourseAccess({ courseId, userId: user.$id, lessonId });

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Lock className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-medium">Lesson Locked</h1>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          This lesson is part of a paid course. Enroll to get access to all
          lessons and course materials.
        </p>
        <Link
          href={`/courses/${String(course.slug ?? courseId)}`}
          className="h-10 inline-flex items-center bg-foreground px-6 text-sm text-background transition-opacity hover:opacity-90"
        >
          View Course
        </Link>
      </div>
    );
  }

  // Get all lessons for navigation
  let allLessons: AnyRow[] = [];
  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.orderAsc("order"),
        Query.limit(200),
      ],
    });
    allLessons = result.rows as AnyRow[];
  } catch {
    // No navigation
  }

  const currentIndex = allLessons.findIndex((l) => l.$id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  // Build video URL
  const videoFileId = String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? "");
  const thumbnailFileId = String(
    lesson.thumbnailFileId ?? lesson.videoThumbnailFileId ?? lesson.thumbnailId ?? ""
  );
  const videoUrl = videoFileId
    ? getFileViewUrl(APPWRITE_CONFIG.buckets.courseVideos, videoFileId)
    : "";
  const posterUrl = thumbnailFileId
    ? getFilePreviewUrl(APPWRITE_CONFIG.buckets.courseThumbnails, thumbnailFileId, 1280, 720)
    : "";

  // Get progress, comments, and lesson resources
  const [{ completedLessonIds }, comments, lessonResourcesResult, lessonProgressResult, enrollmentResult] = await Promise.all([
    getCourseProgress(courseId, user.$id),
    getLessonComments(lessonId),
    tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.resources,
      queries: [Query.equal("lessonId", [lessonId]), Query.limit(100)],
    }).catch(() => ({ rows: [] })),
    tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [user.$id]),
        Query.equal("lessonId", [lessonId]),
        Query.limit(1),
      ],
    }).catch(() => ({ rows: [] })),
    tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    }).catch(() => ({ rows: [] })),
  ]);
  const lessonProgressRow = (lessonProgressResult.rows[0] as AnyRow | undefined) ?? null;
  const hasEnrollment = enrollmentResult.rows.length > 0;
  const canMarkComplete = courseIsFree || hasEnrollment;
  const lessonPercentComplete = Math.max(
    0,
    Math.min(99, Math.round(Number(lessonProgressRow?.percentComplete ?? 0)))
  );
  const lessonCompleted = completedLessonIds.includes(lessonId);
  const lessonDurationSeconds = Number(lesson.duration ?? 0);
  const resumeSeconds =
    !lessonCompleted && lessonPercentComplete > 0 && lessonDurationSeconds > 0
      ? Math.min(
          Math.round((lessonDurationSeconds * lessonPercentComplete) / 100),
          Math.max(0, lessonDurationSeconds - 1)
        )
      : 0;
  const lessonResources = (lessonResourcesResult.rows as AnyRow[])
    .map((resource) => {
      const type = String(resource.type ?? "file");
      const url = String(resource.url ?? "");
      const fileId = String(resource.fileId ?? "");
      const href =
        type === "link"
          ? url
          : fileId
            ? getFileDownloadUrl(APPWRITE_CONFIG.buckets.courseResources, fileId)
            : "";

      if (!href) {
        return null;
      }

      return {
        id: resource.$id,
        title: String(resource.title ?? "Resource"),
        type,
        href,
      };
    })
    .filter((resource): resource is { id: string; title: string; type: string; href: string } => resource !== null);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Back to course */}
      <Link
        href={`/courses/${String(course.slug ?? courseId)}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-4" />
        {String(course.title ?? "Back to Course")}
      </Link>

      {/* Video player */}
      <LessonVideoPlayer
        courseId={courseId}
        lessonId={lessonId}
        src={videoUrl}
        title={String(lesson.title ?? "Lesson")}
        poster={posterUrl}
        initialPercentComplete={lessonPercentComplete}
        initialResumeSeconds={resumeSeconds}
        isCompleted={lessonCompleted}
        canAutoComplete={canMarkComplete}
      />

      {/* Lesson info + mark complete */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-medium">
            {String(lesson.title ?? "Lesson")}
          </h1>
          {lessonCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 shrink-0 pt-1">
              <CheckCircle className="size-4" />
              Completed
            </span>
          ) : canMarkComplete ? (
            <form action={markLessonCompleteFormAction} className="shrink-0">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              <button
                type="submit"
                className="h-9 border border-border px-4 text-xs transition-colors hover:bg-muted"
              >
                Mark as complete
              </button>
            </form>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 pt-1">
              Preview lesson
            </span>
          )}
        </div>
        {typeof lesson.description === "string" && lesson.description.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {lesson.description}
          </p>
        )}
        {!lessonCompleted && lessonPercentComplete > 0 && (
          <p className="text-xs text-muted-foreground">
            Resume available from about {lessonPercentComplete}% of the lesson.
          </p>
        )}
      </div>

      {lessonResources.length > 0 && (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">
              Lesson Resources ({lessonResources.length})
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {lessonResources.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <span>{resource.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {resource.type}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between border-t border-border pt-4">
        {prevLesson ? (
          <Link
            href={`/app/learn/${courseId}/${prevLesson.$id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        ) : (
          <span />
        )}

        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {allLessons.length}
        </span>

        {nextLesson ? (
          <Link
            href={`/app/learn/${courseId}/${nextLesson.$id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {/* Lesson sidebar */}
      {allLessons.length > 1 && (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">
              Course Lessons ({allLessons.length})
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {allLessons.map((l, i) => {
              const isActive = l.$id === lessonId;
              const isAccessible =
                Boolean(l.isFree) ||
                Boolean(l.isFreePreview) ||
                courseIsFree;

              return (
                <li key={l.$id}>
                  <Link
                    href={`/app/learn/${courseId}/${l.$id}`}
                    className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground w-6">
                      {completedLessonIds.includes(l.$id) ? (
                        <CheckCircle className="size-3.5 text-emerald-600" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="flex-1 truncate">
                      {String(l.title ?? `Lesson ${i + 1}`)}
                    </span>
                    {!isAccessible && (
                      <Lock className="size-3.5 text-muted-foreground shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Comments section */}
      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Discussion ({comments.length})</h2>
        </div>

        <form action={postLessonCommentAction} className="p-5 space-y-3 border-b border-border">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <textarea
            name="text"
            required
            minLength={2}
            placeholder="Ask a doubt or share an insight from this lesson..."
            className="w-full min-h-20 border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="h-9 px-4 bg-foreground text-background text-xs transition-opacity hover:opacity-90"
          >
            Post comment
          </button>
        </form>

        <div className="divide-y divide-border">
          {comments.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              No comments yet. Be the first to start the discussion.
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="px-5 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{c.userName}</span>
                {c.userRole !== "student" && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">
                    {c.userRole}
                  </span>
                )}
                {c.isPinned && (
                  <span className="text-[10px] text-amber-600">📌 Pinned</span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
