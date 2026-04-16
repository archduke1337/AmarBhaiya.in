"use client";

import { startTransition, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  VideoPlayer,
  type VideoProgressSnapshot,
} from "@/components/video-player";

type LessonVideoPlayerProps = {
  courseId: string;
  lessonId: string;
  src: string;
  title?: string;
  poster?: string;
  initialPercentComplete?: number;
  initialResumeSeconds?: number;
  isCompleted?: boolean;
  canAutoComplete?: boolean;
};

export function LessonVideoPlayer({
  courseId,
  lessonId,
  src,
  title,
  poster,
  initialPercentComplete = 0,
  initialResumeSeconds = 0,
  isCompleted = false,
  canAutoComplete = false,
}: LessonVideoPlayerProps) {
  const router = useRouter();
  const lastSentPercentRef = useRef(
    Math.max(0, Math.min(99, Math.round(initialPercentComplete)))
  );
  const lastSentTimeRef = useRef(Math.max(0, Math.floor(initialResumeSeconds)));
  const completedRef = useRef(isCompleted);
  const completionRequestedRef = useRef(false);

  function persistSnapshot(snapshot: VideoProgressSnapshot) {
    if (completedRef.current) {
      return;
    }

    const roundedTime = Math.max(0, Math.floor(snapshot.currentTime));
    const nextPercent = snapshot.ended
      ? 99
      : Math.max(
          lastSentPercentRef.current,
          Math.max(0, Math.min(99, Math.round(snapshot.percentComplete)))
        );

    if (!snapshot.ended && roundedTime < 5) {
      return;
    }

    const madeMeaningfulTimeProgress = roundedTime - lastSentTimeRef.current >= 10;
    const madeMeaningfulPercentProgress = nextPercent - lastSentPercentRef.current >= 2;

    if (!snapshot.ended && !madeMeaningfulTimeProgress && !madeMeaningfulPercentProgress) {
      return;
    }

    lastSentTimeRef.current = Math.max(lastSentTimeRef.current, roundedTime);
    lastSentPercentRef.current = nextPercent;

    if (snapshot.ended && canAutoComplete && !completionRequestedRef.current) {
      completionRequestedRef.current = true;

      startTransition(() => {
        void fetch("/api/lesson-complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            lessonId,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to complete lesson");
            }

            completedRef.current = true;
            router.refresh();
          })
          .catch(() => {
            completionRequestedRef.current = false;
          });
      });

      return;
    }

    startTransition(() => {
      void fetch("/api/lesson-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          percentComplete: nextPercent,
        }),
      }).catch(() => undefined);
    });
  }

  return (
    <VideoPlayer
      src={src}
      title={title}
      poster={poster}
      initialTimeSeconds={isCompleted ? 0 : initialResumeSeconds}
      onProgressSnapshot={persistSnapshot}
    />
  );
}
