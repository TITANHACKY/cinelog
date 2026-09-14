import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title?: string;
  titleClassName?: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  titleClassName,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-secondary">
          {icon}
        </div>
      ) : null}
      {title ? (
        <h3
          className={cn(
            "font-heading text-lg font-medium text-on-surface",
            titleClassName,
          )}
        >
          {title}
        </h3>
      ) : null}
      <p className="max-w-sm font-public-sans text-xs text-secondary">
        {description}
      </p>
      {action}
    </div>
  );
}
