import AnimatedProgressBar from "@/components/smoothui/animated-progress-bar";

type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <AnimatedProgressBar
      value={safeValue}
      label={`${safeValue}% complete`}
      labelClassName="sr-only"
      className="space-y-2"
      barClassName="bg-accent"
    />
  );
}
