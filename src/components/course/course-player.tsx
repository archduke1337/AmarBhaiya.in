"use client";

import { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CommentSection } from "./comment-section";
import { LessonSidebar, type LessonModule } from "./lesson-sidebar";
import { ProgressBar } from "./progress-bar";
import { VideoPlayer } from "./video-player";

type CoursePlayerProps = {
  courseTitle: string;
  modules: LessonModule[];
  resources: Array<{ label: string; href: string }>;
};

export function CoursePlayer({ courseTitle, modules, resources }: CoursePlayerProps) {
  const flattenedLessons = useMemo(
    () => modules.flatMap((module) => module.lessons),
    [modules]
  );

  const [activeLessonId, setActiveLessonId] = useState(flattenedLessons[0]?.id ?? "");
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const activeLesson =
    flattenedLessons.find((lesson) => lesson.id === activeLessonId) ??
    flattenedLessons[0];

  const progressPercent =
    flattenedLessons.length === 0
      ? 0
      : (completedLessonIds.length / flattenedLessons.length) * 100;

  function markLessonComplete() {
    if (!activeLesson) {
      return;
    }

    setCompletedLessonIds((prev) => {
      if (prev.includes(activeLesson.id)) {
        return prev;
      }

      return [...prev, activeLesson.id];
    });
  }

  if (!activeLesson) {
    return (
      <div className="border border-border p-8 text-muted-foreground">
        No lessons configured for this course yet.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="border border-border p-5 md:p-6 space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Course player
        </p>
        <h2 className="text-2xl md:text-3xl leading-tight">{courseTitle}</h2>
        <ProgressBar value={progressPercent} />
      </div>

      <div className="grid xl:grid-cols-[320px_1fr] gap-5">
        <LessonSidebar
          modules={modules}
          activeLessonId={activeLesson.id}
          completedLessonIds={completedLessonIds}
          onSelectLesson={setActiveLessonId}
        />

        <div className="space-y-5">
          <VideoPlayer
            lessonTitle={activeLesson.title}
            durationMinutes={activeLesson.durationMinutes}
          />

          <div className="border border-border p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Current lesson</p>
              <p className="mt-1">{activeLesson.title}</p>
            </div>
            <button
              type="button"
              onClick={markLessonComplete}
              className="h-9 px-4 bg-foreground text-background text-sm"
            >
              Mark as complete
            </button>
          </div>

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="border border-border p-5 text-sm text-muted-foreground leading-relaxed">
              This lesson focuses on practical execution. Follow the sequence,
              pause after each section, and implement while learning.
            </TabsContent>

            <TabsContent value="resources" className="border border-border p-5">
              {resources.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No downloadable resources are available for this course yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {resources.map((resource) => (
                    <li key={resource.label}>
                      <a
                        href={resource.href}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
                      >
                        {resource.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="notes" className="border border-border p-5 space-y-3">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Write key takeaways or doubts for this lesson"
                className="w-full min-h-32 border border-border bg-background px-3 py-2"
              />
              <p className="text-xs text-muted-foreground">
                Notes are currently local to this session. Server persistence can be connected next.
              </p>
            </TabsContent>

            <TabsContent value="quiz" className="border border-border p-5 text-sm text-muted-foreground leading-relaxed">
              Quiz interface is planned in Phase 11. This slot is reserved for
              lesson-level assessment.
            </TabsContent>

            <TabsContent value="comments" className="border border-border p-5">
              <CommentSection initialComments={[]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
