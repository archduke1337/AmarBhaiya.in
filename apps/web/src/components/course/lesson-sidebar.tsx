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
    <div className="border border-border p-4 md:p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
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
                          "w-full border px-3 py-2 text-left text-sm flex items-center justify-between gap-3 transition-colors",
                          isActive
                            ? "bg-foreground text-background border-foreground"
                            : "border-border hover:border-foreground/30"
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
