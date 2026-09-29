import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
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
  /** Extra classes for every option button (e.g. taller tap targets). */
  optionClassName?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  stretch = false,
  "aria-label": ariaLabel,
  optionClassName,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        stretch ? SEGMENTED_CONTROL_STRETCH_CLASS : SEGMENTED_CONTROL_CLASS,
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const className = cn(
          "min-h-8 rounded-lg px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm",
          stretch && "min-w-0",
          optionClassName,
        );
        const content = (
          <>
            {option.icon}
            {option.label}
            {option.badge}
          </>
        );

        if (option.href) {
          return (
            <ButtonLink
              aria-current={isActive ? "page" : undefined}
              aria-pressed={isActive}
              className={className}
              href={option.href}
              key={option.value}
              onClick={() => onChange?.(option.value)}
              variant={isActive ? "primaryFilled" : "darkFilled"}
            >
              {content}
            </ButtonLink>
          );
        }

        return (
          <Button
            aria-pressed={isActive}
            className={className}
            key={option.value}
            onClick={() => onChange?.(option.value)}
            type="button"
            variant={isActive ? "primaryFilled" : "darkFilled"}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}
