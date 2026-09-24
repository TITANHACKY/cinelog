"use client";

import { COMMON_LANGUAGES, LANGUAGE_MAX } from "@/lib/constants";
import { useLocales } from "@/hooks/locales/use-locales";
import { SelectableChip } from "@/components/onboarding/selectable-chip";

export function StepLanguages({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  // Prefer the live locales name when the table is populated; otherwise fall
  // back to the curated label so a chip always reads as a language name, never
  // a bare ISO code.
  const { formatLanguage } = useLocales();
  const atMax = selected.length >= LANGUAGE_MAX;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_LANGUAGES.map(({ code, label }) => {
          const isSelected = selected.includes(code);
          return (
            <SelectableChip
              key={code}
              label={formatLanguage(code) || label}
              selected={isSelected}
              disabled={!isSelected && atMax}
              onToggle={() => onToggle(code)}
            />
          );
        })}
      </div>
      <p className="font-public-sans text-xs text-secondary">
        Pick at least 1 (up to {LANGUAGE_MAX}).
      </p>
    </div>
  );
}
