type VideoPlayerProps = {
  lessonTitle: string;
  durationMinutes: number;
  videoUrl?: string;
};

export function VideoPlayer({
  lessonTitle,
  durationMinutes,
  videoUrl,
}: VideoPlayerProps) {
  if (videoUrl) {
    return (
      <div className="border border-border overflow-hidden">
        <video
          controls
          className="w-full aspect-video bg-black"
          src={videoUrl}
          preload="metadata"
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  return (
    <div className="border border-border aspect-video bg-linear-to-br from-card to-muted flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Lesson Preview
        </p>
        <h3 className="text-xl max-w-xl">{lessonTitle}</h3>
        <p className="text-sm text-muted-foreground">Estimated duration: {durationMinutes} min</p>
      </div>
    </div>
  );
}
