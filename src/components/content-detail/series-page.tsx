"use client";

import { HeroHeader } from "@/components/content-detail/hero-header/hero-header";
import { ContentProgress } from "@/components/content-detail/progress/content-progress";
import { SeriesTabs } from "@/components/content-detail/tabs/series-tabs";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useContentDetails } from "@/hooks/title-details/use-content-details";
import type { SeriesDetails } from "@/lib/types";
import { useParams } from "next/navigation";

export function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: series,
    error,
    isLoading,
    retry,
  } = useContentDetails<SeriesDetails>("series", id);

  if (isLoading) {
    return (
      <main className="relative min-h-[calc(100vh-3.5rem)]">
        <div aria-hidden="true" className="blur-sm">
          <HeroHeader type="series" />
          <ContentProgress type="series" />
        </div>
        <LoadingOverlay />
      </main>
    );
  }

  if (error || !series) {
    return (
      <ErrorState
        message={error?.message ?? "The series could not be loaded."}
        onRetry={retry}
      />
    );
  }

  return (
    <main className="pb-12">
      <HeroHeader series={series} type="series" />
      <ContentProgress series={series} type="series" />
      <SeriesTabs series={series} />
    </main>
  );
}
