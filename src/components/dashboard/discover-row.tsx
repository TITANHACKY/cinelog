"use client";

import {
  CalendarClock,
  Clapperboard,
  Gem,
  History,
  Languages,
  Loader2,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { DiscoverCard } from "@/components/dashboard/discover-card";
import { Carousel } from "@/components/ui/carousel";
import { useDiscoverRow } from "@/hooks/dashboard/use-discover-row";
import type {
  DiscoverRow as DiscoverRowData,
  DiscoverRowKind,
} from "@/lib/types";

const ROW_ICONS: Record<DiscoverRowKind, LucideIcon> = {
  trending: TrendingUp,
  because: Sparkles,
  genre: Clapperboard,
  new: CalendarClock,
  lang: Languages,
  gems: Gem,
  era: History,
};

export function DiscoverRow({ row }: { row: DiscoverRowData }) {
  const { items, isFetchingMore, onNearEnd } = useDiscoverRow(row);
  const Icon = ROW_ICONS[row.kind];

  return (
    <Carousel
      extraHeader={
        row.mediaType === "mixed" ? null : (
          <span className="rounded-md border border-outline-variant bg-surface-container-high px-2 py-0.5 font-public-sans text-[10px] font-medium text-secondary">
            {row.mediaType === "movie" ? "Movies" : "Series"}
          </span>
        )
      }
      headingId={`discover-${row.key.replace(/:/g, "-")}-heading`}
      icon={<Icon className="h-4.5 w-4.5" />}
      navAlwaysVisible
      onNearEnd={onNearEnd}
      showNav
      title={row.title}
    >
      {items.map((item) => (
        <div
          className="w-40 shrink-0 sm:w-60"
          key={`${item.mediaType}-${item.tmdbId}`}
        >
          <DiscoverCard item={item} />
        </div>
      ))}
      {isFetchingMore ? (
        <div className="flex w-16 shrink-0 items-center justify-center py-8 text-brand-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : null}
    </Carousel>
  );
}
