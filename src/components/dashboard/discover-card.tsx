"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardStatusToggle } from "@/components/ui/card-status-toggle";
import { MediaCard } from "@/components/ui/media-card";
import { Tooltip } from "@/components/ui/tooltip";
import { useDiscoverCard } from "@/hooks/dashboard/use-discover-card";
import { useLocales } from "@/hooks/locales/use-locales";
import { NON_RELEASED_MEDIA_TOOLTIP, WATCH_STATUS } from "@/lib/constants";
import { hasAiredOnOrBeforeToday } from "@/lib/media/air-date";
import {
  WATCH_STATUS_ICONS,
  WATCH_STATUS_INDICATOR,
  WATCH_STATUS_INDICATOR_TEXT,
} from "@/lib/media/watch-status";
import { cn } from "@/lib/utils";
import type { DiscoverTitle } from "@/lib/types";

export function DiscoverCard({ item }: { item: DiscoverTitle }) {
  const card = useDiscoverCard(item);
  const { formatLanguage } = useLocales();
  const inLibrary = item.watchStatus !== null;
  const watchStatus = item.watchStatus ?? 0;
  const StatusIcon =
    WATCH_STATUS_ICONS[watchStatus as keyof typeof WATCH_STATUS_ICONS] ??
    WATCH_STATUS_ICONS[0];
  const statusText =
    WATCH_STATUS_INDICATOR_TEXT[
      WATCH_STATUS_INDICATOR[watchStatus] ?? WATCH_STATUS_INDICATOR[0]
    ];
  const statusLabel =
    Object.values(WATCH_STATUS).find((option) => option.value === watchStatus)
      ?.display_value ?? WATCH_STATUS[0].display_value;
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
    isUnreleased ? (
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
    )
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
      meta={formatLanguage(item.originalLanguage)}
      overlay={
        inLibrary ? (
          <span
            className={cn(
              "absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-xs border border-outline-variant bg-surface-container px-1.5 py-0.5 font-public-sans text-[10px] font-bold shadow-xs",
              statusText,
            )}
          >
            <StatusIcon aria-hidden className="size-3" />
            {statusLabel}
          </span>
        ) : null
      }
      posterPath={item.posterPath}
      rating={(item.rating ?? 0).toFixed(1)}
      title={item.title}
      year={item.year ?? ""}
    />
  );
}
