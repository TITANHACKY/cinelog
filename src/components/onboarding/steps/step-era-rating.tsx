"use client";

import { ERA_BUCKETS, MIN_RATING_OPTIONS } from "@/lib/constants";
import { SelectableChip } from "@/components/onboarding/selectable-chip";

export function StepEraRating({
  eras,
  minRating,
  onToggleEra,
  onSetRating,
}: {
  eras: string[];
  minRating: number | null;
  onToggleEra: (era: string) => void;
  onSetRating: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-public-sans text-sm font-medium text-on-surface">
          Favorite eras
        </h3>
        <div className="flex flex-wrap gap-2">
          {ERA_BUCKETS.map((era) => (
            <SelectableChip
              key={era.value}
              label={era.label}
              selected={eras.includes(era.value)}
              onToggle={() => onToggleEra(era.value)}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-public-sans text-sm font-medium text-on-surface">
          Minimum rating
        </h3>
        <div className="flex flex-wrap gap-2">
          {MIN_RATING_OPTIONS.map((option) => (
            <SelectableChip
              key={String(option.value)}
              label={option.label}
              selected={minRating === option.value}
              onToggle={() => onSetRating(option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
