"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

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

  function toggleFullscreen() {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void video.requestFullscreen();
    }
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
    <div className="group relative overflow-hidden border border-border bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="aspect-video w-full cursor-pointer"
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

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 py-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <div
          className="mb-3 h-1 w-full cursor-pointer bg-white/20"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="text-white transition-opacity hover:opacity-80"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="text-white transition-opacity hover:opacity-80"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </button>

            <span className="text-xs text-white/80 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {title && (
              <span className="text-xs text-white/60 hidden sm:block">
                {title}
              </span>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-white transition-opacity hover:opacity-80"
              aria-label="Fullscreen"
            >
              <Maximize className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play video"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="ml-1 size-7 text-white" />
          </div>
        </button>
      )}
    </div>
  );
}
