"use client";

import { LANGUAGE_MAX, LANGUAGE_OPTIONS } from "@/lib/constants";
import { SelectableChip } from "@/components/onboarding/selectable-chip";

export function StepLanguages({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  const atMax = selected.length >= LANGUAGE_MAX;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((lang) => {
          const isSelected = selected.includes(lang.code);
          return (
            <SelectableChip
              key={lang.code}
              label={lang.label}
              selected={isSelected}
              disabled={!isSelected && atMax}
              onToggle={() => onToggle(lang.code)}
            />
          );
        })}
      </div>
      <p className="font-public-sans text-xs text-secondary">
        Optional — up to {LANGUAGE_MAX}.
      </p>
    </div>
  );
}
