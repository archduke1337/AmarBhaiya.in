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
    <div className="flex max-w-6xl flex-col gap-6 pb-6">
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

      <div className="sticky bottom-[5.7rem] z-10 md:static">
        <RetroPanel tone="accent" className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-3 md:flex md:justify-between">
          <div className="justify-self-start">
            {prevLesson ? (
              canOpenLesson(prevLesson) ? (
                <Button asChild variant="outline" size="sm" className="min-h-11">
                  <Link href={`/app/learn/${courseId}/${prevLesson.$id}`}>
                    <ChevronLeft className="size-4" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Lock className="size-4" />
                  Locked
                </span>
              )
            ) : (
              <span />
            )}
          </div>

          <div className="min-w-0 text-center">
            <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Lesson {currentIndex + 1} / {allLessons.length}
            </p>
            <p className="hidden text-xs font-semibold text-foreground/75 sm:block">
              {lessonCompleted ? "Completed" : lessonPercentComplete > 0 ? `${lessonPercentComplete}% watched` : "Ready to study"}
            </p>
          </div>

          <div className="justify-self-end">
            {nextLesson ? (
              canOpenLesson(nextLesson) ? (
                <Button asChild variant="secondary" size="sm" className="min-h-11">
                  <Link href={`/app/learn/${courseId}/${nextLesson.$id}`}>
                    Next
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-muted-foreground">
                  Locked
                  <Lock className="size-4" />
                </span>
              )
            ) : (
              <span />
            )}
          </div>
        </RetroPanel>
      </div>

      <Tabs defaultValue="study" className="gap-4">
        <TabsList variant="line" className="grid w-full grid-cols-4">
          <TabsTrigger value="study">Study</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="doubts">Doubts</TabsTrigger>
          <TabsTrigger value="path">Path</TabsTrigger>
        </TabsList>

        <TabsContent value="study" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <RetroPanel tone="card" className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{String(course.title ?? "Course")}</Badge>
                <Badge variant="ghost">
                  {lessonCompleted ? "Completed" : canMarkComplete ? "In progress" : "Preview"}
                </Badge>
                {lessonPercentComplete > 0 && !lessonCompleted ? (
                  <Badge variant="secondary">{lessonPercentComplete}% watched</Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <h1 className="font-heading text-3xl font-black tracking-[-0.05em] md:text-4xl">
                  {String(lesson.title ?? "Lesson")}
                </h1>
                {typeof lesson.description === "string" && lesson.description.length > 0 ? (
                  <p className="text-sm font-medium leading-7 text-muted-foreground md:text-base">
                    {lesson.description}
                  </p>
                ) : (
                  <p className="text-sm font-medium leading-7 text-muted-foreground md:text-base">
                    Video ko ek baar flow mein dekho, phir notes tab se supporting material open kar lena. Agar doubt aaye toh wahi lesson-level discussion mein poochna.
                  </p>
                )}
                {!lessonCompleted && lessonPercentComplete > 0 ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Resume available from about {lessonPercentComplete}% of the lesson.
                  </p>
                ) : null}
              </div>

              {lessonCompleted ? (
                <span className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-accent)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground shadow-retro-sm">
                  <CheckCircle className="size-4" />
                  Completed
                </span>
              ) : canMarkComplete ? (
                <form action={markLessonCompleteFormAction} className="w-fit">
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="lessonId" value={lessonId} />
                  <Button type="submit" variant="secondary">
                    Mark as complete
                  </Button>
                </form>
              ) : (
                <span className="inline-flex min-h-11 w-fit items-center rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-muted)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-retro-sm">
                  Preview lesson
                </span>
              )}
            </RetroPanel>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <RetroPanel tone="secondary" className="space-y-2">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Progress
                </p>
                <p className="text-3xl font-heading font-black tracking-[-0.06em]">
                  {lessonCompleted ? "100%" : `${lessonPercentComplete}%`}
                </p>
                <p className="text-sm font-medium leading-6 text-foreground/75">
                  Saved while you watch, so budget-phone study breaks do not reset the flow.
                </p>
              </RetroPanel>
              <RetroPanel tone="accent" className="space-y-2">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Resources
                </p>
                <p className="text-3xl font-heading font-black tracking-[-0.06em]">
                  {lessonResourceItems.length}
                </p>
                <p className="text-sm font-medium leading-6 text-foreground/75">
                  PDFs, files, and useful links attached to this exact lesson.
                </p>
              </RetroPanel>
              <RetroPanel tone="muted" className="space-y-2">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Study tip
                </p>
                <p className="text-sm font-medium leading-6 text-foreground/75">
                  Pehle video samjho. Phir notes kholke 10-minute revision karo. Doubt bache toh tabhi pooch do.
                </p>
              </RetroPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {lessonResourceItems.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
              <RetroPanel tone="card" size="lg" className="space-y-4">
                {previewResource ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge variant="outline">PDF preview</Badge>
                        <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
                          {previewResource.title}
                        </h2>
                      </div>
                      <Button asChild variant="outline" size="sm" className="min-h-11">
                        <a href={previewResource.downloadHref} target="_blank" rel="noreferrer">
                          <Download className="size-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                    <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border-2 border-border bg-white shadow-retro-sm">
                      <iframe
                        title={previewResource.title}
                        src={previewResource.href}
                        className="h-[68dvh] min-h-[24rem] w-full bg-white"
                      />
                    </div>
                  </>
                ) : (
                  <RetroPanel tone="muted" className="space-y-3">
                    <FileText className="size-5" />
                    <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
                      Preview ke liye PDF attached nahi hai.
                    </h2>
                    <p className="text-sm font-medium leading-7 text-foreground/80">
                      Is lesson ke resources available hain, lekin browser preview sirf PDF files ke liye dikhaya jata hai.
                    </p>
                  </RetroPanel>
                )}
              </RetroPanel>

              <RetroPanel tone="secondary" className="space-y-0 p-0">
                <div className="border-b-2 border-border px-5 py-4">
                  <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
                    Lesson resources ({lessonResourceItems.length})
                  </h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Open, preview, or download what you need
                  </p>
                </div>
                <ul className="divide-y-2 divide-border">
                  {lessonResourceItems.map((resource) => (
                    <li key={resource.id} className="space-y-3 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{resource.title}</p>
                          <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
                            {resource.type}
                          </p>
                        </div>
                        {resource.isPreviewable ? <Badge variant="outline">Preview</Badge> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="min-h-11">
                          <a href={resource.href} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                            Open
                          </a>
                        </Button>
                        {resource.type !== "link" ? (
                          <Button asChild variant="secondary" size="sm" className="min-h-11">
                            <a href={resource.downloadHref} target="_blank" rel="noreferrer">
                              <Download className="size-4" />
                              Download
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </RetroPanel>
            </div>
          ) : (
            <RetroPanel tone="muted" size="lg" className="space-y-3">
              <FileText className="size-6" />
              <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
                Is lesson mein abhi notes attach nahi hue hain.
              </h2>
              <p className="max-w-2xl text-sm font-medium leading-7 text-foreground/80">
                Jab instructor PDF ya resource attach karega, woh yahin preview aur download ke saath dikhega.
              </p>
            </RetroPanel>
          )}
        </TabsContent>

        <TabsContent value="doubts" className="space-y-4">
          <RetroPanel tone="muted" className="space-y-0 p-0">
            <div className="border-b-2 border-border px-5 py-4">
              <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
                Lesson discussion ({comments.length})
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Is topic ka doubt yahin poochna
              </p>
            </div>

            <form action={postLessonCommentAction} className="space-y-3 border-b-2 border-border p-5">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="lessonId" value={lessonId} />
              <Textarea
                name="text"
                required
                minLength={2}
                placeholder="Doubt likho. Short bhi chalega, bas topic clear rakho..."
              />
              <Button type="submit">Post doubt</Button>
            </form>

            <div className="divide-y-2 divide-border">
              {comments.length === 0 ? (
                <p className="px-5 py-5 text-sm font-medium leading-7 text-muted-foreground">
                  Abhi koi doubt nahi hai. Agar kuch atka hai toh yahin pooch do, warna next lesson continue karo.
                </p>
              ) : null}
              {comments.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold">{c.userName}</span>
                    {c.userRole !== "student" ? (
                      <span className="border-2 border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.userRole}
                      </span>
                    ) : null}
                    {c.isPinned ? (
                      <span className="border-2 border-border bg-[color:var(--surface-secondary)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                        Pinned
                      </span>
                    ) : null}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </RetroPanel>
        </TabsContent>

        <TabsContent value="path" className="space-y-4">
          <RetroPanel tone="card" className="space-y-0 p-0">
            <div className="border-b-2 border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4" />
                <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
                  Course path ({allLessons.length})
                </h2>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Lesson sequence ko clean rakho. Jump karo, lekin context mat khona.
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
                        className={`flex min-h-14 items-center gap-3 px-5 py-3 text-sm transition-colors ${
                          isActive
                            ? "bg-[color:var(--surface-accent)] font-semibold"
                            : "hover:bg-[color:var(--surface-ink)]"
                        }`}
                      >
                        <span className="flex w-7 justify-center text-xs text-muted-foreground">
                          {completedLessonIds.includes(l.$id) ? (
                            <CheckCircle className="size-4 text-emerald-600" />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {String(l.title ?? `Lesson ${i + 1}`)}
                        </span>
                        {isActive ? <Badge variant="outline">Now</Badge> : null}
                      </Link>
                    ) : (
                      <div className="flex min-h-14 items-center gap-3 px-5 py-3 text-sm text-muted-foreground">
                        <span className="w-7 text-center text-xs">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate">
                          {String(l.title ?? `Lesson ${i + 1}`)}
                        </span>
                        <Lock className="size-4 shrink-0" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </RetroPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
