"use client";

import { Compass, Loader2, RefreshCw, SlidersHorizontal } from "lucide-react";
import { DiscoverRow } from "@/components/dashboard/discover-row";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { DiscoverRow as DiscoverRowData } from "@/lib/types";

type DiscoverSectionProps = {
  enabled: boolean;
  rows: DiscoverRowData[];
  isLoading: boolean;
  errorMessage: string | null;
  isRetrying: boolean;
  retry: () => void;
};

function DiscoverRowSkeleton() {
  return (
    <div aria-hidden className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-surface-container motion-safe:animate-pulse" />
        <div className="h-5 w-48 max-w-full rounded-md bg-surface-container motion-safe:animate-pulse sm:h-6" />
      </div>
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="aspect-2/3 w-40 shrink-0 rounded-xl bg-surface-container motion-safe:animate-pulse sm:w-60"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export function DiscoverSection({
  enabled,
  rows,
  isLoading,
  errorMessage,
  isRetrying,
  retry,
}: DiscoverSectionProps) {
  if (!enabled) return null;
  if (!isLoading && !errorMessage && rows.length === 0) return null;

  return (
    <section
      aria-busy={isLoading}
      aria-label="Discover"
      className="flex min-w-0 flex-col gap-6 sm:gap-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-4 w-4 shrink-0 text-brand-primary" />
          <p className="font-public-sans text-xs font-semibold tracking-wide text-brand-primary uppercase">
            Discover
          </p>
          <span className="truncate font-public-sans text-xs text-secondary">
            Picked from your preferences
          </span>
        </div>
        <ButtonLink
          className="h-11 gap-1.5 px-3 text-xs sm:h-9"
          href="/settings/preferences"
          variant="darkTonal"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Tune
        </ButtonLink>
      </div>

      {isLoading ? (
        <>
          <DiscoverRowSkeleton />
          <DiscoverRowSkeleton />
        </>
      ) : errorMessage ? (
        <EmptyState
          action={
            <Button
              className="h-11 gap-2 px-4 sm:h-10"
              disabled={isRetrying}
              onClick={retry}
              type="button"
              variant="darkTonal"
            >
              {isRetrying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Try again
            </Button>
          }
          description={errorMessage}
          title="Recommendations unavailable"
        />
      ) : (
        rows.map((row) => <DiscoverRow key={row.key} row={row} />)
      )}
    </section>
  );
}
