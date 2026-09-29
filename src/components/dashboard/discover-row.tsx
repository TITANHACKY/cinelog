"use client";

import { Loader2, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DiscoverCard } from "@/components/dashboard/discover-card";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { useDiscoverRowItems } from "@/hooks/dashboard/use-discover-row-items";
import type { DiscoverRowId } from "@/lib/types";

const SKELETON_CARDS = 6;
const ROW_MESSAGE_CLASS =
  "flex min-h-40 w-full flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 sm:min-h-60";

type DiscoverRowProps = {
  rowId: DiscoverRowId;
  // null = nothing to load (e.g. no genre maps to this media type).
  rowKey: string | null;
  title: string;
  icon: LucideIcon;
  controls?: ReactNode;
};

export function DiscoverRow({
  rowId,
  rowKey,
  title,
  icon: Icon,
  controls,
}: DiscoverRowProps) {
  const row = useDiscoverRowItems(rowKey);

  let cards: ReactNode = null;
  let message: ReactNode = null;
  if (row.isLoading) {
    cards = Array.from({ length: SKELETON_CARDS }, (_, index) => (
      <div
        aria-hidden
        className="aspect-2/3 w-40 shrink-0 rounded-xl bg-surface-container motion-safe:animate-pulse sm:w-60"
        key={index}
      />
    ));
  } else if (row.errorMessage) {
    message = (
      <div className={ROW_MESSAGE_CLASS}>
        <p className="font-public-sans text-sm text-secondary">
          {row.errorMessage}
        </p>
        <Button
          className="h-11 gap-2 px-4 sm:h-10"
          disabled={row.isRetrying}
          onClick={row.retry}
          type="button"
          variant="darkTonal"
        >
          {row.isRetrying ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Try again
        </Button>
      </div>
    );
  } else if (row.items.length === 0) {
    message = (
      <p
        className={`${ROW_MESSAGE_CLASS} font-public-sans text-sm text-secondary`}
      >
        Nothing here yet
      </p>
    );
  } else {
    cards = (
      <>
        {row.items.map((item) => (
          <div
            className="w-40 shrink-0 sm:w-60"
            key={`${item.mediaType}-${item.tmdbId}`}
          >
            <DiscoverCard item={item} />
          </div>
        ))}
        {row.isFetchingMore ? (
          <div className="flex w-16 shrink-0 items-center justify-center py-8 text-brand-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : null}
        {row.loadMoreFailed ? (
          <div className="flex w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-3 text-center sm:w-60">
            <p className="font-public-sans text-xs text-secondary">
              Couldn&apos;t load more
            </p>
            <Button
              className="h-11 gap-2 px-3 sm:h-9"
              onClick={row.retryMore}
              type="button"
              variant="darkTonal"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <Carousel
      empty={message}
      extraHeader={controls}
      headingId={`discover-${rowId}-heading`}
      icon={<Icon className="h-4.5 w-4.5" />}
      navAlwaysVisible
      onNearEnd={row.onNearEnd}
      showNav={row.items.length > 0}
      title={title}
    >
      {cards}
    </Carousel>
  );
}
