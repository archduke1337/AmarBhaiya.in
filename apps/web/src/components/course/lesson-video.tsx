"use client";

import { useRef, useState } from "react";
import {
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type VideoProgressSnapshot = {
  currentTime: number;
  duration: number;
  percentComplete: number;
  ended: boolean;
};

type VideoPlayerProps = {
  src: string;
  title?: string;
  poster?: string;
  initialTimeSeconds?: number;
  onProgressSnapshot?: (snapshot: VideoProgressSnapshot) => void;
};

export function VideoPlayer({
  src,
  title,
  poster,
  initialTimeSeconds = 0,
  onProgressSnapshot,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastUiSyncRef = useRef(0);
  const lastProgressEmitRef = useRef(0);
  const restoredInitialTimeRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  function emitProgressSnapshot(ended = false) {
    const video = videoRef.current;
    if (!video || !video.duration || !onProgressSnapshot) {
      return;
    }

    onProgressSnapshot({
      currentTime: video.currentTime,
      duration: video.duration,
      percentComplete: (video.currentTime / video.duration) * 100,
      ended,
    });
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const now = video.currentTime;
    const shouldSync =
      now - lastUiSyncRef.current >= 0.25 || now >= video.duration;

    if (!shouldSync) {
      return;
    }

    lastUiSyncRef.current = now;
    setCurrentTime(now);
    setProgress((now / video.duration) * 100);

    if (now - lastProgressEmitRef.current >= 15 || now >= video.duration - 1) {
      lastProgressEmitRef.current = now;
      emitProgressSnapshot(now >= video.duration - 1);
    }
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;

    if (!restoredInitialTimeRef.current && initialTimeSeconds > 0) {
      const resumeAt = Math.min(
        Math.max(0, initialTimeSeconds),
        Math.max(0, video.duration - 1)
      );

      if (resumeAt > 0) {
        video.currentTime = resumeAt;
        lastUiSyncRef.current = resumeAt;
        lastProgressEmitRef.current = resumeAt;
        setCurrentTime(resumeAt);
        setProgress((resumeAt / video.duration) * 100);
      }

      restoredInitialTimeRef.current = true;
    }

    setDuration(video.duration);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const targetTime = percent * video.duration;

    video.currentTime = targetTime;
    lastUiSyncRef.current = targetTime;
    setCurrentTime(targetTime);
    setProgress(percent * 100);
  }

  function seekBy(seconds: number) {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const targetTime = Math.min(
      Math.max(0, video.currentTime + seconds),
      video.duration
    );

    video.currentTime = targetTime;
    lastUiSyncRef.current = targetTime;
    setCurrentTime(targetTime);
    setProgress((targetTime / video.duration) * 100);
  }

  function toggleFullscreen() {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void video.requestFullscreen();
    }
  }

  async function togglePictureInPicture() {
    const video = videoRef.current;
    if (
      !video ||
      typeof document === "undefined" ||
      !("pictureInPictureEnabled" in document) ||
      !document.pictureInPictureEnabled
    ) {
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }

      if ("requestPictureInPicture" in video) {
        await video.requestPictureInPicture();
      }
    } catch {
      // Ignore PiP failures on unsupported browsers or restricted devices.
    }
  }

  function updatePlaybackRate(nextRate: number) {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = nextRate;
    }
    setPlaybackRate(nextRate);
  }

  function formatTime(seconds: number): string {
    if (!seconds || !Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">No video available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[calc(var(--radius)+8px)] border-2 border-border bg-[color:var(--surface-card)] shadow-retro">
      <div className="relative border-b-2 border-border bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="aspect-video w-full cursor-pointer bg-black object-contain"
          playsInline
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            emitProgressSnapshot();
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            const video = videoRef.current;
            setIsPlaying(false);
            if (!video || !video.duration) return;
            lastUiSyncRef.current = video.duration;
            lastProgressEmitRef.current = video.duration;
            setCurrentTime(video.duration);
            setProgress(100);
            emitProgressSnapshot(true);
          }}
          preload="metadata"
        />

        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/10"
            aria-label="Play video"
          >
            <div className="flex size-16 items-center justify-center rounded-[calc(var(--radius)+6px)] border-2 border-border bg-[color:var(--surface-secondary)] shadow-retro transition-transform hover:-translate-y-1">
              <Play className="ml-1 size-7 text-foreground" />
            </div>
          </button>
        )}
      </div>

      <div className="space-y-3 bg-[color:var(--surface-card)] px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <p className="font-heading text-lg font-black tracking-[-0.04em]">
                {title}
              </p>
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => seekBy(-10)}
              variant="outline"
              size="icon"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              type="button"
              onClick={togglePlay}
              variant="secondary"
              size="icon"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              type="button"
              onClick={() => seekBy(10)}
              variant="outline"
              size="icon"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="size-4" />
            </Button>
            <Button
              type="button"
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void togglePictureInPicture();
              }}
              variant="ghost"
              size="icon"
              aria-label="Picture in picture"
            >
              <PictureInPicture2 className="size-4" />
            </Button>
            <Button
              type="button"
              onClick={toggleFullscreen}
              variant="outline"
              size="icon"
              aria-label="Fullscreen"
            >
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>

        <div
          className="h-4 cursor-pointer rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-ink)] p-[3px]"
          onClick={handleSeek}
          aria-label="Seek through lesson video"
        >
          <div className="h-full rounded-full bg-background/70">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <Button
              key={rate}
              type="button"
              variant={playbackRate === rate ? "secondary" : "outline"}
              size="sm"
              className="min-h-11 min-w-[3.5rem]"
              onClick={() => updatePlaybackRate(rate)}
              aria-label={`Set playback speed to ${rate}x`}
            >
              {rate}x
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
