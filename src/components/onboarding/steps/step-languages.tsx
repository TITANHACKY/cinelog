"use client";

import { COMMON_LANGUAGE_CODES, LANGUAGE_MAX } from "@/lib/constants";
import { useLocales } from "@/hooks/locales/use-locales";
import { SelectableChip } from "@/components/onboarding/selectable-chip";

export function StepLanguages({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  // Names come from the locales table so nothing language-specific is hardcoded;
  // if a code isn't found yet, formatLanguage falls back to the code itself.
  const { formatLanguage } = useLocales();
  const atMax = selected.length >= LANGUAGE_MAX;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_LANGUAGE_CODES.map((code) => {
          const isSelected = selected.includes(code);
          return (
            <SelectableChip
              key={code}
              label={formatLanguage(code) || code}
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
