"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardRemoveButton } from "@/components/ui/card-remove-button";
import { CardStatusToggle } from "@/components/ui/card-status-toggle";
import { MediaCard } from "@/components/ui/media-card";
import { Tooltip } from "@/components/ui/tooltip";
import { useDiscoverCard } from "@/hooks/dashboard/use-discover-card";
import { useLocales } from "@/hooks/locales/use-locales";
import { NON_RELEASED_MEDIA_TOOLTIP } from "@/lib/constants";
import { hasAiredOnOrBeforeToday } from "@/lib/media/air-date";
import { formatMediaMeta } from "@/lib/media/display";
import type { DiscoverTitle } from "@/lib/types";

// Library titles use the same footer as MovieCard/SeriesCard: remove, then
// the status toggle. Titles outside the library get an Add button.
export function DiscoverCard({ item }: { item: DiscoverTitle }) {
  const card = useDiscoverCard(item);
  const { formatLanguage, formatCountry } = useLocales();
  const inLibrary = item.watchStatus !== null;
  const watchStatus = item.watchStatus ?? 0;
  const isUnreleased =
    watchStatus === 0 && !hasAiredOnOrBeforeToday(item.releaseDate);

  const statusToggle = (
    <CardStatusToggle
      disabled={card.isPending || isUnreleased}
      expanded
      loading={card.isStatusPending}
      onSelect={card.setStatus}
      watchStatus={watchStatus}
    />
  );

  const actions = inLibrary ? (
    <>
      <CardRemoveButton
        disabled={card.isPending}
        isInLibrary
        loading={card.isRemovePending}
        onClick={card.remove}
      />
      {isUnreleased ? (
        <Tooltip
          align="end"
          className="min-w-0 flex-1"
          content={NON_RELEASED_MEDIA_TOOLTIP}
          contentClassName="whitespace-nowrap"
          triggerClassName="w-full"
        >
          {statusToggle}
        </Tooltip>
      ) : (
        statusToggle
      )}
    </>
  ) : (
    <Button
      aria-label={`Add ${item.title} to watchlist`}
      className="h-11 w-full gap-1.5 text-xs sm:h-9"
      disabled={card.isPending}
      onClick={card.add}
      type="button"
      variant="darkTonal"
    >
      {card.isAdding ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
      Add
    </Button>
  );

  return (
    <MediaCard
      actions={actions}
      actionsPosition="below"
      href={card.href}
      imageLoading="lazy"
      meta={formatMediaMeta(
        formatLanguage(item.originalLanguage),
        formatCountry(item.originCountry),
      )}
      posterPath={item.posterPath}
      rating={(item.rating ?? 0).toFixed(1)}
      title={item.title}
      year={item.year ?? ""}
    />
  );
}
