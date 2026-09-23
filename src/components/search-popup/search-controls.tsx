"use client";

import { useMemo } from "react";
import { Clapperboard, TvMinimal } from "lucide-react";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getSearchYears, getLanguageOptions } from "@/lib/search/filters";
import { useLocales } from "@/hooks/locales/use-locales";

export type SearchMediaType = "movie" | "series";

type SearchControlsProps = {
  mediaType: SearchMediaType;
  onMediaTypeChange: (mediaType: SearchMediaType) => void;
  onLanguageChange: (language?: string) => void;
  onYearChange: (year?: number) => void;
  language?: string;
  year?: number;
};

export function SearchControls({
  mediaType,
  onMediaTypeChange,
  onLanguageChange,
  onYearChange,
  language,
  year,
}: SearchControlsProps) {
  const { languages } = useLocales();
  const yearOptions = useMemo(
    () => [
      { value: "", label: "Any year" },
      ...getSearchYears().map((searchYear) => ({
        value: String(searchYear),
        label: String(searchYear),
      })),
    ],
    [],
  );
  const languageOptions = useMemo(
    () => [
      { value: "", label: "Any language" },
      ...getLanguageOptions(languages),
    ],
    [languages],
  );

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5 sm:gap-3 sm:pt-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SegmentedControl
          onChange={onMediaTypeChange}
          options={[
            {
              value: "movie",
              label: "Movies",
              icon: <Clapperboard className="size-3.5 shrink-0" />,
            },
            {
              value: "series",
              label: "Series",
              icon: <TvMinimal className="size-3.5 shrink-0" />,
            },
          ]}
          value={mediaType}
        />

        <div className="flex min-w-0 shrink-0 items-center gap-1 rounded-xl border border-outline-alt bg-surface-container-low p-1">
          <SearchFilterSelect
            aria-label="Filter by year"
            heading="Year"
            onChange={(nextYear) =>
              onYearChange(nextYear ? Number(nextYear) : undefined)
            }
            options={yearOptions}
            placeholder="Any year"
            value={year ? String(year) : ""}
          />
          <SearchFilterSelect
            aria-label="Filter by language"
            heading="Language"
            onChange={(nextLanguage) =>
              onLanguageChange(nextLanguage || undefined)
            }
            options={languageOptions}
            placeholder="Any language"
            searchPlaceholder="Search languages"
            searchable
            value={language ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
