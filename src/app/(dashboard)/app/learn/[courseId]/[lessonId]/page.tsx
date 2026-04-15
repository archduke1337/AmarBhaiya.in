import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MessageSquareMore,
} from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  getFilePreviewUrl,
} from "@/lib/utils/file-urls";
import { normalizeHttpUrl } from "@/lib/utils/url";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { Textarea } from "@/components/ui/textarea";
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

  const listAllRows = async (
    tableId: string,
    queries: string[] = []
  ): Promise<AnyRow[]> => {
    try {
      const rows: AnyRow[] = [];
      let offset = 0;

      while (true) {
        const result = await tablesDB.listRows({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId,
          queries: [...queries, Query.limit(500), Query.offset(offset)],
        });

        rows.push(...(result.rows as AnyRow[]));

        if (result.rows.length < 500) {
          break;
        }

        offset += result.rows.length;
      }

      return rows;
    } catch {
      return [];
    }
  };

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
      <RetroPanel tone="muted" size="lg" className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-14 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h1 className="font-heading text-3xl font-black tracking-[-0.05em]">Lesson Locked</h1>
        <p className="max-w-md text-sm font-medium leading-7 text-muted-foreground">
          This lesson sits inside a paid course. Enroll to access the full lesson sequence, downloadable resources, and discussion.
        </p>
        <Button asChild size="lg">
          <Link href={`/courses/${String(course.slug ?? courseId)}`}>View Course</Link>
        </Button>
      </RetroPanel>
    );
  }

  // Get all lessons for navigation
  const allLessons = await listAllRows(APPWRITE_CONFIG.tables.lessons, [
    Query.equal("courseId", [courseId]),
    Query.orderAsc("order"),
  ]);

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
    ? `/api/lesson-video/${courseId}/${lessonId}`
    : "";
  const posterUrl = thumbnailFileId
    ? getFilePreviewUrl(APPWRITE_CONFIG.buckets.courseThumbnails, thumbnailFileId, 1280, 720)
    : "";

  // Get progress, comments, and lesson resources
  const [{ completedLessonIds }, comments, lessonResources, lessonProgressResult, enrollmentResult] = await Promise.all([
    getCourseProgress(courseId, user.$id),
    getLessonComments(lessonId),
    listAllRows(APPWRITE_CONFIG.tables.resources, [
      Query.equal("lessonId", [lessonId]),
    ]),
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
  const hasFullCourseAccess = courseIsFree || hasEnrollment;
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
  const lessonResourceItems = lessonResources
    .map((resource) => {
      const type = String(resource.type ?? "file");
      const url = String(resource.url ?? "");
      const fileId = String(resource.fileId ?? "");
      const href =
        type === "link"
          ? normalizeHttpUrl(url) || ""
          : fileId
            ? `/api/course-resource/${resource.$id}`
            : "";

      if (!href) {
        return null;
      }

      return {
        id: resource.$id,
        title: String(resource.title ?? "Resource"),
        type,
        href,
        downloadHref: type === "link" ? href : `${href}?download=1`,
        isPreviewable: type === "pdf" && href.startsWith("/"),
      };
    })
    .filter(
      (
        resource
      ): resource is {
        id: string;
        title: string;
        type: string;
        href: string;
        downloadHref: string;
        isPreviewable: boolean;
      } => resource !== null
    );
  const previewResource = lessonResourceItems.find((resource) => resource.isPreviewable) ?? null;

  function canOpenLesson(row: AnyRow | null | undefined): boolean {
    if (!row) {
      return false;
    }

    return hasFullCourseAccess || Boolean(row.isFree) || Boolean(row.isFreePreview);
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6 pb-6">
      {/* Back to course */}
      <Link
        href={`/courses/${String(course.slug ?? courseId)}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {String(course.title ?? "Back to Course")}
      </Link>

      <RetroPanel tone="secondary" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Lesson view</Badge>
          <Badge variant="ghost">
            {currentIndex + 1} of {allLessons.length}
          </Badge>
          {lessonResourceItems.length > 0 ? (
            <Badge variant="secondary">{lessonResourceItems.length} resources</Badge>
          ) : null}
        </div>
        <p className="text-sm font-medium leading-7 text-foreground/80">
          This page is designed for actual studying on smaller screens: watch the video, grab the notes or files you need, then move to the next lesson without losing your place.
        </p>
      </RetroPanel>

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
      <RetroPanel tone="card" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{String(course.title ?? "Course")}</Badge>
          <Badge variant="ghost">
            {lessonCompleted ? "Completed" : canMarkComplete ? "In progress" : "Preview"}
          </Badge>
          {lessonPercentComplete > 0 && !lessonCompleted ? (
            <Badge variant="secondary">{lessonPercentComplete}% watched</Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-black tracking-[-0.05em]">
              {String(lesson.title ?? "Lesson")}
            </h1>
            {typeof lesson.description === "string" && lesson.description.length > 0 && (
              <p className="text-sm font-medium leading-7 text-muted-foreground">
                {lesson.description}
              </p>
            )}
            {!lessonCompleted && lessonPercentComplete > 0 && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Resume available from about {lessonPercentComplete}% of the lesson.
              </p>
            )}
          </div>
          {lessonCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 shrink-0 pt-1">
              <CheckCircle className="size-4" />
              Completed
            </span>
          ) : canMarkComplete ? (
            <form action={markLessonCompleteFormAction} className="shrink-0">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              <Button type="submit" variant="secondary" size="sm">
                Mark as complete
              </Button>
            </form>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground shrink-0 pt-1">
              Preview lesson
            </span>
          )}
        </div>
      </RetroPanel>

      <section className="grid gap-4 lg:grid-cols-3">
        <RetroPanel tone="card" className="space-y-3">
          <PlaySquare className="size-4" />
          <h2 className="font-heading text-xl font-black tracking-[-0.04em]">
            Watch with context
          </h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            The lesson title, progress, and resume state stay visible so students can come back without starting from zero.
          </p>
        </RetroPanel>
        <RetroPanel tone="accent" className="space-y-3">
          <Download className="size-4" />
          <h2 className="font-heading text-xl font-black tracking-[-0.04em]">
            Pull resources fast
          </h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Notes and files stay below the player so students can find them immediately during revision or homework.
          </p>
        </RetroPanel>
        <RetroPanel tone="card" className="space-y-3">
          <MessageSquareMore className="size-4" />
          <h2 className="font-heading text-xl font-black tracking-[-0.04em]">
            Ask lesson-level doubts
          </h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Lesson discussion is for doubts from this exact topic, not for broad course planning or unrelated questions.
          </p>
        </RetroPanel>
      </section>

      {lessonResourceItems.length > 0 && (
        <RetroPanel tone="secondary" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
              Lesson Resources ({lessonResourceItems.length})
            </h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Notes, downloads, and supporting links for this lesson
            </p>
          </div>
          <ul className="divide-y-2 divide-border">
            {lessonResourceItems.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-5 py-4 text-sm transition-colors hover:bg-background/60"
                >
                  <span className="font-semibold">{resource.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {resource.type}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </RetroPanel>
      )}

      {/* Navigation */}
      <RetroPanel tone="accent" className="flex flex-wrap items-center justify-between gap-3">
        {prevLesson ? (
          canOpenLesson(prevLesson) ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/learn/${courseId}/${prevLesson.$id}`}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="size-4" />
              Previous locked
            </span>
          )
        ) : (
          <span />
        )}

        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {allLessons.length}
        </span>

        {nextLesson ? (
          canOpenLesson(nextLesson) ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/learn/${courseId}/${nextLesson.$id}`}>
                Next
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              Next locked
              <Lock className="size-4" />
            </span>
          )
        ) : (
          <span />
        )}
      </RetroPanel>

      {/* Lesson sidebar */}
      {allLessons.length > 1 && (
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
              Course Lessons ({allLessons.length})
            </h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Jump across the lesson path without losing your study flow
            </p>
          </div>
          <ul className="divide-y-2 divide-border">
            {allLessons.map((l, i) => {
              const isActive = l.$id === lessonId;
              const isAccessible = canOpenLesson(l);

              return (
                <li key={l.$id}>
                  {isAccessible ? (
                    <Link
                      href={`/app/learn/${courseId}/${l.$id}`}
                      className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                        isActive
                          ? "bg-[color:var(--surface-accent)] font-medium"
                          : "hover:bg-[color:var(--surface-ink)]"
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
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground">
                      <span className="text-xs w-6">{i + 1}</span>
                      <span className="flex-1 truncate">
                        {String(l.title ?? `Lesson ${i + 1}`)}
                      </span>
                      <Lock className="size-3.5 shrink-0" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </RetroPanel>
      )}

      {/* Comments section */}
      <RetroPanel tone="muted" className="space-y-0 p-0">
        <div className="border-b-2 border-border px-5 py-3">
          <h2 className="font-heading text-lg font-black tracking-[-0.03em]">Discussion ({comments.length})</h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Ask about this lesson only
          </p>
        </div>

        <form action={postLessonCommentAction} className="border-b-2 border-border p-5 space-y-3">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <Textarea
            name="text"
            required
            minLength={2}
            placeholder="Ask a doubt or share an insight from this lesson..."
          />
          <Button type="submit" size="sm">
            Post comment
          </Button>
        </form>

        <div className="divide-y-2 divide-border">
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
                  <span className="border-2 border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
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
      </RetroPanel>
    </div>
  );
}
