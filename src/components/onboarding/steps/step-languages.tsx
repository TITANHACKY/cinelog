"use client";

import { useMemo } from "react";
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
  // Use the live locales name only when the table actually has the code; the
  // curated label is the fallback. (We can't use formatLanguage here — it
  // returns the raw code when a name is missing, which would defeat the
  // fallback and leave bare codes on the screen.)
  const { languages } = useLocales();
  const liveNameByCode = useMemo(
    () => new Map(languages.map((lang) => [lang.iso_639_1, lang.english_name])),
    [languages],
  );

  const atMax = selected.length >= LANGUAGE_MAX;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_LANGUAGES.map(({ code, label }) => {
          const isSelected = selected.includes(code);
          return (
            <SelectableChip
              key={code}
              label={liveNameByCode.get(code) ?? label}
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
