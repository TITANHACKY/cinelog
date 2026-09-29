"use client";

import { Compass, Loader2, RefreshCw, SlidersHorizontal } from "lucide-react";
import { DiscoverRows } from "@/components/dashboard/discover-rows";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { DiscoverLayoutReady } from "@/lib/types";

type DiscoverSectionProps = {
  enabled: boolean;
  layout: DiscoverLayoutReady | null;
  isLoading: boolean;
  errorMessage: string | null;
  isRetrying: boolean;
  retry: () => void;
};

const HEADER_PLACEHOLDERS = 5;

export function DiscoverSection({
  enabled,
  layout,
  isLoading,
  errorMessage,
  isRetrying,
  retry,
}: DiscoverSectionProps) {
  if (!enabled) return null;

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

      {layout ? (
        <DiscoverRows layout={layout} />
      ) : isLoading ? (
        Array.from({ length: HEADER_PLACEHOLDERS }, (_, index) => (
          <div
            aria-hidden
            className="flex items-center gap-2.5 sm:gap-3"
            key={index}
          >
            <div className="h-8 w-8 shrink-0 rounded-lg bg-surface-container motion-safe:animate-pulse" />
            <div className="h-5 w-48 max-w-full rounded-md bg-surface-container motion-safe:animate-pulse sm:h-6" />
          </div>
        ))
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
      ) : null}
    </section>
  );
}
