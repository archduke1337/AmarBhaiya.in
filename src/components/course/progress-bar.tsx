type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <span>Progress</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 w-full bg-muted">
        <div
          className="h-2 bg-foreground transition-all"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
