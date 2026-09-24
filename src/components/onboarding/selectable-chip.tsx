"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SelectableChip({
  label,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      )}
    >
      <Badge
        variant={selected ? "selected" : "default"}
        className={cn(
          "min-h-11 px-3.5 py-2 text-xs sm:text-sm",
          selected ? "text-on-surface" : "text-secondary",
        )}
        // Always render the check slot (invisible when unselected) so toggling
        // selection doesn't shift the chip's width.
        inlineStart={
          <Check
            className={cn("text-brand-primary", selected ? "visible" : "invisible")}
          />
        }
        text={label}
      />
    </button>
  );
}
