"use client";

import { Film, Layers, Tv } from "lucide-react";
import { MEDIA_LEAN_OPTIONS } from "@/lib/constants";
import { SelectableCard } from "@/components/onboarding/selectable-card";
import type { MediaLean } from "@/lib/types";

const ICONS = { 0: Film, 1: Tv, 2: Layers } as const;

export function StepMediaLean({
  value,
  chosen,
  onSelect,
}: {
  value: MediaLean;
  chosen: boolean;
  onSelect: (value: MediaLean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {MEDIA_LEAN_OPTIONS.map((option) => (
        <SelectableCard
          key={option.value}
          title={option.label}
          description={option.description}
          Icon={ICONS[option.value]}
          selected={chosen && value === option.value}
          onSelect={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}
