"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type LessonItem = {
  id: string;
  title: string;
  durationMinutes: number;
};

export type LessonModule = {
  id: string;
  title: string;
  lessons: LessonItem[];
};

type LessonSidebarProps = {
  modules: LessonModule[];
  activeLessonId: string;
  completedLessonIds: string[];
  onSelectLesson: (lessonId: string) => void;
};

export function LessonSidebar({
  modules,
  activeLessonId,
  completedLessonIds,
  onSelectLesson,
}: LessonSidebarProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-surface p-4 shadow-[var(--surface-shadow)] md:p-5">
      <p className="mb-4 font-sans text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        Curriculum
      </p>

      <Accordion type="multiple" defaultValue={modules.map((module) => module.id)}>
        {modules.map((module) => (
          <AccordionItem key={module.id} value={module.id}>
            <AccordionTrigger>{module.title}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === activeLessonId;
                  const isDone = completedLessonIds.includes(lesson.id);

                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => onSelectLesson(lesson.id)}
                        className={cn(
                          "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground border-accent font-bold shadow-retro-sm"
                            : "border-border/60 bg-background hover:border-accent/40 hover:bg-surface-hover"
                        )}
                      >
                        <span className="truncate">{lesson.title}</span>
                        <span className="text-xs shrink-0">
                          {isDone ? "Done" : `${lesson.durationMinutes}m`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
