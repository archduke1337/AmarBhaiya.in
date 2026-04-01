import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, CheckCircle } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { getFileViewUrl } from "@/lib/utils/file-urls";
import { VideoPlayer } from "@/components/video-player";
import { markLessonCompleteAction, getCourseProgress } from "@/actions/enrollment";
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

  // Check access - is the student enrolled, or is this a free/preview lesson?
  const isFree = Boolean(lesson.isFree) || Boolean(lesson.isFreePreview);
  const courseIsFree = String(course.accessModel) === "free";

  if (!isFree && !courseIsFree) {
    // Check enrollment
    try {
      const enrollment = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("userId", [user.$id]),
          Query.limit(1),
        ],
      });

      if (enrollment.rows.length === 0) {
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
    } catch {
      // If enrollment check fails, still allow for safety
    }
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
  const videoFileId = String(lesson.videoFileId ?? "");
  const videoUrl = videoFileId
    ? getFileViewUrl(APPWRITE_CONFIG.buckets.courseVideos, videoFileId)
    : "";

  // Get progress
  const { completedLessonIds } = await getCourseProgress(courseId, user.$id);

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
      <VideoPlayer
        src={videoUrl}
        title={String(lesson.title ?? "Lesson")}
      />

      {/* Lesson info + mark complete */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-medium">
            {String(lesson.title ?? "Lesson")}
          </h1>
          {completedLessonIds.includes(lessonId) ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 shrink-0 pt-1">
              <CheckCircle className="size-4" />
              Completed
            </span>
          ) : (
            <form action={markLessonCompleteAction} className="shrink-0">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              <button
                type="submit"
                className="h-9 border border-border px-4 text-xs transition-colors hover:bg-muted"
              >
                Mark as complete
              </button>
            </form>
          )}
        </div>
        {typeof lesson.description === "string" && lesson.description.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {lesson.description}
          </p>
        )}
      </div>

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
    </div>
  );
}
