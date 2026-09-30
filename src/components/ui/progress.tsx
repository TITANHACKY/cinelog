import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ProgressColorVariant =
  | "primary"
  | "accentAlt"
  | "info"
  | "success"
  | "warning"
  | "error";

const variantColorMap: Record<ProgressColorVariant, string> = {
  primary: "bg-brand-primary",
  accentAlt: "bg-brand-tertiary-accent-alt",
  info: "bg-status-info",
  success: "bg-status-success",
  warning: "bg-status-warning",
  error: "bg-status-error",
};

export type ProgressProps = ComponentProps<"div"> & {
  value?: number;
  max?: number;
  /**
   * Predefined semantic color theme for in-progress state (< 100%).
   * Defaults to "primary" ("bg-brand-primary").
   */
  colorVariant?: ProgressColorVariant;
  /**
   * Custom background class for in-progress state (< 100%).
   * Takes precedence over colorVariant.
   * e.g. "bg-brand-tertiary-accent-alt", "bg-sky-500", etc.
   */
  inProgressColor?: string;
  /**
   * Custom background class for completed state (>= 100%).
   * Defaults to Emerald Green victory gradient:
   * "anim-complete-green bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
   */
  completeColor?: string;
  /**
   * Additional classes for the inner indicator bar.
   */
  indicatorClassName?: string;
  /**
   * Whether to enable animated candy-stripe and shimmer. Defaults to true.
   */
  animated?: boolean;
};

function Progress({
  className,
  value = 0,
  max = 100,
  colorVariant = "primary",
  inProgressColor,
  completeColor,
  indicatorClassName,
  animated = true,
  ...props
}: ProgressProps) {
  const percentage = Math.min(
    Math.max(((value ?? 0) / (max || 1)) * 100, 0),
    100,
  );
  const isComplete = percentage >= 100;

  const resolvedInProgressColor =
    inProgressColor || variantColorMap[colorVariant] || "bg-brand-primary";

  const defaultCompleteColor =
    "anim-complete-green bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]";
  const resolvedCompleteColor = completeColor || defaultCompleteColor;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-surface-container-high transition-colors duration-300",
        isComplete && "ring-1 ring-emerald-400/40",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden",
          isComplete
            ? resolvedCompleteColor
            : cn(resolvedInProgressColor, animated && "anim-progress-stripe"),
          indicatorClassName,
        )}
        style={{ width: `${percentage}%` }}
      >
        {/* Animated laser shimmer / green victory sweep overlay */}
        {animated && percentage > 0 && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0",
              isComplete
                ? "anim-complete-green-sweep w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                : "anim-progress-shimmer w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent",
            )}
          />
        )}
      </div>
    </div>
  );
}

export { Progress };

