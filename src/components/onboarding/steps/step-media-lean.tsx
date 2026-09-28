"use client";

import { Film, Layers, Tv } from "lucide-react";
import { SelectableCard } from "@/components/onboarding/selectable-card";
import { MEDIA_LEAN_OPTIONS } from "@/lib/constants";
import type { MediaLean } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = { 0: Film, 1: Tv, 2: Layers } as const;

export function StepMediaLean({
  value,
  chosen,
  layout = "stack",
  onSelect,
}: {
  value: MediaLean;
  chosen: boolean;
  layout?: "stack" | "rowOnDesktop";
  onSelect: (value: MediaLean) => void;
}) {
  const rowOnDesktop = layout === "rowOnDesktop";

  return (
    <div className={cn("flex flex-col gap-3", rowOnDesktop && "sm:flex-row")}>
      {MEDIA_LEAN_OPTIONS.map((option) => (
        <div
          className={cn(rowOnDesktop && "sm:min-w-0 sm:flex-1")}
          key={option.value}
        >
          <SelectableCard
            description={option.description}
            Icon={ICONS[option.value]}
            onSelect={() => onSelect(option.value)}
            selected={chosen && value === option.value}
            title={option.label}
          />
        </div>
      ))}
    </div>
  );
}
