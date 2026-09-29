import type { Metadata } from "next";
import { SeriesPage } from "@/components/content-detail/series-page";
import { AppShell } from "@/components/layout/app-shell";
import { getSeriesDetails } from "@/services/series";

type SeriesRoutePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SeriesRoutePageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseInt(id, 10);

  if (isNaN(seriesId)) {
    return {
      title: "Series Details",
      description: "TV Series details, seasons and episodes on CineLog",
    };
  }

  try {
    const series = await Promise.race([
      getSeriesDetails(seriesId),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    if (!series) {
      return {
        title: "CineLog - Series Details",
        description: "TV Series details, seasons and episodes on CineLog",
      };
    }

    const seriesTitle = series.name || "Series Details";
    const releaseYear = series.first_air_date
      ? ` (${new Date(series.first_air_date).getFullYear()})`
      : "";

    return {
      title: `${seriesTitle}${releaseYear}`,
      description:
        series.overview ||
        `View details, seasons, episodes, cast and track ${seriesTitle} on CineLog.`,
      openGraph: {
        title: `CineLog - ${seriesTitle}${releaseYear}`,
        description: series.overview || undefined,
        images: series.poster_path
          ? [`https://image.tmdb.org/t/p/w500${series.poster_path}`]
          : [],
      },
    };
  } catch {
    return {
      title: "CineLog - Series Details",
      description: "TV Series details, seasons and episodes on CineLog",
    };
  }
}

export default function SeriesRoutePage() {
  return (
    <AppShell>
      <SeriesPage />
    </AppShell>
  );
}
