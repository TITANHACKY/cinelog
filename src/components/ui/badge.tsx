import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BadgeIndicator } from "@/lib/types";

type BadgeVariant = "default" | "selected";

type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  text?: ReactNode;
  inlineStart?: ReactNode;
  inlineEnd?: ReactNode;
  indicator?: BadgeIndicator;
  variant?: BadgeVariant;
  children?: ReactNode;
};

const indicatorClasses: Record<BadgeIndicator, string> = {
  success: "bg-status-success",
  info: "bg-status-info",
  error: "bg-status-error",
  accentAlt: "bg-brand-tertiary-accent-alt",
};

// Border + surface tokens live here (not in the base) so a variant can swap them
// reliably — the project's `cn` is a plain join, not tailwind-merge.
const variantClasses: Record<BadgeVariant, string> = {
  default: "border-outline-alt bg-surface-container-low",
  selected: "border-brand-primary bg-brand-primary-container/15 text-on-surface",
};

function Badge({
  children,
  className,
  indicator,
  inlineEnd,
  inlineStart,
  text,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-3 py-1 font-public-sans text-xs leading-4 font-medium whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {indicator ? (
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            indicatorClasses[indicator],
          )}
        />
      ) : null}
      {inlineStart ? (
        <span className="flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-full">
          {inlineStart}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{text ?? children}</span>
      {inlineEnd ? (
        <span className="flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-full">
          {inlineEnd}
        </span>
      ) : null}
    </span>
  );
}

export { Badge };
export type { BadgeIndicator, BadgeProps, BadgeVariant };
