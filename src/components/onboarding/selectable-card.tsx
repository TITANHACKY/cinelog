"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const cardVariants = {
  selected: "border-status-success bg-status-success/15",
  unselected:
    "border-outline-variant bg-surface-container hover:border-outline-alt",
};

export function SelectableCard({
  title,
  description,
  selected,
  onSelect,
  Icon,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  Icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-success",
        selected ? cardVariants.selected : cardVariants.unselected,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 font-public-sans text-sm font-medium text-on-surface">
          {Icon ? (
            <Icon
              className={cn(
                "h-4 w-4",
                selected ? "text-status-success" : "text-secondary",
              )}
            />
          ) : null}
          {title}
        </span>
        {selected ? <Check className="h-4 w-4 text-status-success" /> : null}
      </div>
      {description ? (
        <span className="font-public-sans text-xs text-secondary">
          {description}
        </span>
      ) : null}
    </button>
  );
}
