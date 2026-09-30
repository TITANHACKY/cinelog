import type { ReactNode } from "react";
import Link from "next/link";
import {
  SEGMENTED_CONTROL_CLASS,
  SEGMENTED_CONTROL_STRETCH_CLASS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  href?: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  className?: string;
  /**
   * When true, the control fills its container and every option gets an
   * equal share of the width (e.g. 50/50 for two options).
   */
  stretch?: boolean;
  "aria-label"?: string;
};

const tabItemBaseClass =
  "group relative inline-flex min-w-0 items-center justify-center rounded-lg px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

const tabItemActiveClass =
  "bg-brand-primary-container text-white shadow-xs font-semibold";

const tabItemInactiveClass =
  "text-secondary hover:text-on-surface hover:bg-surface-container-high/60";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  stretch = false,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  const hasBadges = options.some((option) => Boolean(option.badge));

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        stretch ? SEGMENTED_CONTROL_STRETCH_CLASS : SEGMENTED_CONTROL_CLASS,
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const itemClassName = cn(
          tabItemBaseClass,
          hasBadges ? "h-11 sm:h-9" : "h-8.5",
          isActive ? tabItemActiveClass : tabItemInactiveClass,
          stretch && "w-full lg:w-auto min-w-0",
        );
        const content = option.badge ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 min-w-0">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">
              {option.icon && (
                <span className="flex shrink-0 items-center">
                  {option.icon}
                </span>
              )}
              <span className="whitespace-nowrap text-xs sm:text-sm font-medium">
                {option.label}
              </span>
            </div>
            <span className="flex shrink-0 items-center">{option.badge}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">
            {option.icon && (
              <span className="flex shrink-0 items-center">{option.icon}</span>
            )}
            <span className="whitespace-nowrap text-xs sm:text-sm font-medium">
              {option.label}
            </span>
          </div>
        );

        if (option.href) {
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              aria-selected={isActive}
              className={itemClassName}
              href={option.href}
              key={option.value}
              onClick={() => onChange?.(option.value)}
              role="tab"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            aria-selected={isActive}
            className={itemClassName}
            key={option.value}
            onClick={() => onChange?.(option.value)}
            role="tab"
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
