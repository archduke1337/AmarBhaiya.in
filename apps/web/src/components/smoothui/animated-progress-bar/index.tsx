import { motion, useReducedMotion } from "motion/react";

export interface AnimatedProgressBarProps {
  barClassName?: string;
  className?: string;
  color?: string;
  label?: string;
  labelClassName?: string;
  value: number; // 0-100
  /**
   * To replay the animation, change the React 'key' prop on this component from the parent.
   */
}

const MIN_PROGRESS_VALUE = 0;
const MAX_PROGRESS_VALUE = 100;

const SPRING = {
  damping: 10,
  duration: 0.25,
  mass: 0.75,
  stiffness: 100,
  type: "spring" as const,
};

export default function AnimatedProgressBar({
  value,
  label,
  color = "var(--accent)",
  className = "",
  barClassName = "",
  labelClassName = "",
}: AnimatedProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-label={label ?? "Progress"}
      aria-valuemax={MAX_PROGRESS_VALUE}
      aria-valuemin={MIN_PROGRESS_VALUE}
      aria-valuenow={Math.max(MIN_PROGRESS_VALUE, Math.min(MAX_PROGRESS_VALUE, value))}
      className={`w-full ${className}`}
      role="progressbar"
    >
      {label ? (
        <div className={`mb-1 font-medium text-sm ${labelClassName}`}>
          {label}
        </div>
      ) : null}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-border/60 bg-background/80">
        <motion.div
          animate={{
            scaleX: Math.max(MIN_PROGRESS_VALUE, Math.min(MAX_PROGRESS_VALUE, value)) / MAX_PROGRESS_VALUE,
          }}
          className={`h-full origin-left rounded bg-accent ${barClassName}`}
          initial={{ scaleX: MIN_PROGRESS_VALUE }}
          style={{ backgroundColor: color }}
          transition={shouldReduceMotion ? { duration: 0 } : SPRING}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
