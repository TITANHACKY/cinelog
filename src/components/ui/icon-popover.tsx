"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { usePopover } from "@/hooks/use-popover";
import { ICON_POPOVER_MENU_CLASS, TRIGGER_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type IconPopoverOption<T> = {
  value: T;
  label: string;
  icon: LucideIcon;
  className?: string;
};

type IconPopoverProps<T> = {
  options: IconPopoverOption<T>[];
  value: T | null;
  disabled?: boolean;
  loading?: boolean;
  triggerAriaLabel: string;
  triggerClassName?: string;
  triggerIcon?: LucideIcon;
  allowDeselect?: boolean;
  onSelect: (value: T) => void;
  triggerLabel?: string;
  expanded?: boolean;
  showMenuLabels?: boolean;
  className?: string;
};

export function IconPopover<T>({
  options,
  value,
  disabled = false,
  loading = false,
  triggerAriaLabel,
  triggerClassName,
  triggerIcon,
  allowDeselect = false,
  onSelect,
  triggerLabel,
  expanded = false,
  showMenuLabels,
  className,
}: IconPopoverProps<T>) {
  const { isOpen, containerRef, toggle, close } = usePopover(disabled || loading);
  const current = options.find((option) => option.value === value);
  const CurrentIcon = current?.icon ?? triggerIcon ?? options[0]?.icon;
  const hasMenuLabels = showMenuLabels ?? expanded;

  return (
    <div
      className={cn("relative", expanded && "flex-1 min-w-0", className)}
      ref={containerRef}
    >
      <div
        className={cn(
          hasMenuLabels
            ? "absolute bottom-full right-0 z-20 mb-1.5 flex origin-bottom flex-col-reverse gap-1 rounded-lg border border-outline-alt bg-surface-container p-1 shadow-[0_8px_24px_rgb(0_0_0/35%)] transition-all duration-200 ease-out min-w-[140px] w-full max-w-[200px]"
            : ICON_POPOVER_MENU_CLASS,
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0",
        )}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = option.value === value;

          return (
            <button
              aria-label={option.label}
              aria-pressed={isActive}
              className={cn(
                hasMenuLabels
                  ? "flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                  : "flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-surface-container-high",
                isActive && "bg-surface-container-high font-semibold",
              )}
              key={String(option.value)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                close();
                if (isActive && !allowDeselect) return;
                onSelect(option.value);
              }}
              tabIndex={isOpen ? 0 : -1}
              title={option.label}
              type="button"
            >
              <Icon className={cn("h-4 w-4 shrink-0", option.className)} />
              {hasMenuLabels ? (
                <span className="truncate">{option.label}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <button
        aria-expanded={isOpen}
        aria-label={triggerAriaLabel}
        className={cn(
          expanded
            ? "flex h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50"
            : TRIGGER_CLASS,
          triggerClassName,
        )}
        disabled={disabled || loading}
        onClick={toggle}
        type="button"
      >
        {loading ? (
          <Loader2
            className={cn(
              "animate-spin text-current",
              expanded ? "size-3.5" : "h-4 w-4",
            )}
          />
        ) : CurrentIcon ? (
          <CurrentIcon className={cn(expanded ? "size-3.5" : "h-4 w-4")} />
        ) : null}
        {expanded && triggerLabel ? (
          <span className="truncate">{triggerLabel}</span>
        ) : null}
      </button>
    </div>
  );
}

