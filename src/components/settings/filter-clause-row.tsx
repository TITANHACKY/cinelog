"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMMON_CERTS, FIELD_OPTIONS, OPERATOR_OPTIONS } from "@/lib/constants";
import { useGenres } from "@/hooks/use-genres";
import {
  getTmdbLanguageOptions,
  getTmdbRegionOptions,
} from "@/lib/search/filters";
import type { CollectionFilterItem } from "@/lib/types";
import { Trash2 } from "lucide-react";

type FilterClauseRowProps = {
  clause: CollectionFilterItem;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (
    field: keyof CollectionFilterItem,
    value: string | number,
  ) => void;
};

export function FilterClauseRow({
  clause,
  index,
  canRemove,
  onRemove,
  onUpdate,
}: FilterClauseRowProps) {
  const { genres, loading: genresLoading } = useGenres();
  const languageOptions = getTmdbLanguageOptions();
  const regionOptions = getTmdbRegionOptions();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-alt/60 bg-surface-container p-2.5 sm:flex-nowrap">
      <span className="font-mono text-[11px] font-semibold text-outline-muted sm:w-6">
        #{index + 1}
      </span>
      <select
        className="h-8 w-full rounded border border-outline-alt bg-surface-container-high px-2 font-public-sans text-xs text-on-surface outline-none sm:w-32"
        onChange={(event) => onUpdate("field", event.target.value)}
        value={clause.field}
      >
        {FIELD_OPTIONS.map((field) => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 w-full rounded border border-outline-alt bg-surface-container-high px-2 font-mono text-xs text-on-surface outline-none sm:w-20"
        onChange={(event) => onUpdate("operator", Number(event.target.value))}
        value={clause.operator}
      >
        {OPERATOR_OPTIONS.map((operator) => (
          <option key={operator.value} value={operator.value}>
            {operator.label}
          </option>
        ))}
      </select>
      <div className="w-full min-w-0 sm:flex-1">
        {clause.field === "genre" ? (
          <select
            className="h-8 w-full rounded border border-outline-alt bg-surface-container-high px-2 font-public-sans text-xs text-on-surface outline-none"
            disabled={genresLoading}
            onChange={(event) => onUpdate("value", event.target.value)}
            value={clause.value}
          >
            {genres.map((genre) => (
              <option key={genre.tmdb_id} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>
        ) : clause.field === "original_language" ? (
          <select
            className="h-8 w-full rounded border border-outline-alt bg-surface-container-high px-2 font-public-sans text-xs text-on-surface outline-none"
            onChange={(event) => onUpdate("value", event.target.value)}
            value={clause.value}
          >
            {languageOptions.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        ) : clause.field === "origin_country" ? (
          <select
            className="h-8 w-full rounded border border-outline-alt bg-surface-container-high px-2 font-public-sans text-xs text-on-surface outline-none"
            onChange={(event) => onUpdate("value", event.target.value)}
            value={clause.value}
          >
            {regionOptions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        ) : clause.field === "certification" ? (
          <select
            className="h-8 w-full rounded border border-outline-alt bg-surface-container-high px-2 font-public-sans text-xs text-on-surface outline-none"
            onChange={(event) => onUpdate("value", event.target.value)}
            value={clause.value}
          >
            {COMMON_CERTS.map((cert) => (
              <option key={cert} value={cert}>
                {cert}
              </option>
            ))}
          </select>
        ) : (
          <Input
            className="h-8 border-outline-alt bg-surface-container-high text-xs"
            onChange={(event) => onUpdate("value", event.target.value)}
            placeholder="e.g. 2020"
            required
            type="text"
            value={clause.value}
          />
        )}
      </div>
      <Button
        className="ml-auto h-8 w-8 shrink-0 text-status-error border border-current/30 bg-current/10 hover:bg-current/20 disabled:opacity-30 sm:ml-0"
        disabled={!canRemove}
        onClick={onRemove}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
