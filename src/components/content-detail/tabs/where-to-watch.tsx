"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Play, Tv } from "lucide-react";
import { useLocales } from "@/hooks/locales/use-locales";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import type { WatchProviderCountry, WatchProviderItem } from "@/lib/types";

type WhereToWatchProps = {
  watchProviders?: Record<string, WatchProviderCountry>;
  availableCountries?: string[];
  imdbId?: string | null;
  tmdbId?: number;
};

export function WhereToWatch({
  watchProviders = {},
  availableCountries = [],
  imdbId,
  tmdbId,
}: WhereToWatchProps) {
  const { countries } = useLocales();

  const countryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries) {
      map.set(c.iso_3166_1, c.english_name);
    }
    return map;
  }, [countries]);

  const countryList = useMemo(() => {
    const keys =
      availableCountries.length > 0
        ? availableCountries
        : Object.keys(watchProviders);
    return keys
      .map((code) => ({
        code,
        name: countryNameMap.get(code) || code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableCountries, watchProviders, countryNameMap]);

  const countryOptions = useMemo(() => {
    return countryList.map((c) => ({
      value: c.code,
      label: `${c.name} (${c.code})`,
    }));
  }, [countryList]);

  // Default to India ("IN") if available, else first country or "US"
  const defaultCountry = useMemo(() => {
    if (countryList.some((c) => c.code === "IN")) return "IN";
    if (countryList.some((c) => c.code === "US")) return "US";
    return countryList[0]?.code ?? "IN";
  }, [countryList]);

  const [selectedCountry, setSelectedCountry] =
    useState<string>(defaultCountry);

  // If user changed movies or default changed
  const activeCountryCode = watchProviders[selectedCountry]
    ? selectedCountry
    : defaultCountry;

  const currentCountryData = watchProviders[activeCountryCode];
  const flatrate = currentCountryData?.flatrate ?? [];
  const rent = currentCountryData?.rent ?? [];
  const buy = currentCountryData?.buy ?? [];

  const stremioDeepLink = imdbId
    ? `stremio:///detail/movie/${imdbId}`
    : tmdbId
      ? `stremio:///detail/movie/${tmdbId}`
      : "stremio:///";

  const stremioWebLink = imdbId
    ? `https://web.stremio.com/#/detail/movie/${imdbId}`
    : "https://web.stremio.com/";

  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/60 pb-3">
        <div className="flex items-center gap-2">
          <Tv className="h-5 w-5 text-brand-primary" />
          <h3 className="font-heading text-base font-bold text-on-surface">
            Where to Stream
          </h3>
        </div>

        {/* Country Selector Dropdown */}
        {countryOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <SearchFilterSelect
              activeVariant="darkTonal"
              aria-label="Filter streaming country"
              heading="Country"
              menuMinWidth={240}
              onChange={(nextCountry) => {
                if (nextCountry) {
                  setSelectedCountry(nextCountry);
                }
              }}
              options={countryOptions}
              placeholder="Select country"
              searchPlaceholder="Search country..."
              searchable
              triggerClassName="h-9 px-3 text-xs"
              value={activeCountryCode}
            />
          </div>
        )}
      </div>

      {/* Providers Content */}
      <div className="space-y-5">
        {/* Stream (Flatrate) */}
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-outline-muted mb-2.5">
            Streaming Subscription
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            {flatrate.length > 0 ? (
              flatrate.map((provider) => (
                <ProviderBadge key={provider.provider_id} provider={provider} />
              ))
            ) : (
              <span className="text-xs text-on-surface-variant italic">
                No subscription streaming reported for this region.
              </span>
            )}

            {/* Stremio Option */}
            <a
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-2.5 py-1.5 text-xs font-medium text-on-surface shadow-2xs"
              href={stremioDeepLink}
              rel="noopener noreferrer"
              target="_blank"
              title="Open in Stremio application or Web"
              onClick={() => {
                // If protocol doesn't launch, user can open web stremio
                setTimeout(() => {
                  window.open(stremioWebLink, "_blank", "noopener,noreferrer");
                }, 500);
              }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white">
                <Play className="h-3.5 w-3.5 fill-current" />
              </div>
              <span>Stremio</span>
            </a>
          </div>
        </div>

        {/* Rent & Buy if available */}
        {(rent.length > 0 || buy.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/40">
            {rent.length > 0 && (
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-outline-muted mb-2">
                  Rent
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {rent.map((provider) => (
                    <ProviderBadge
                      key={`rent-${provider.provider_id}`}
                      provider={provider}
                    />
                  ))}
                </div>
              </div>
            )}

            {buy.length > 0 && (
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-outline-muted mb-2">
                  Buy
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {buy.map((provider) => (
                    <ProviderBadge
                      key={`buy-${provider.provider_id}`}
                      provider={provider}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mandatory JustWatch Attribution Requirement */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3 text-[11px] text-outline-muted">
        <div className="flex items-center gap-1.5">
          <span>Streaming data powered by</span>
          <a
            className="font-semibold text-brand-primary underline hover:text-brand-primary/80"
            href="https://www.justwatch.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            JustWatch
          </a>
        </div>
      </div>
    </section>
  );
}

function ProviderBadge({ provider }: { provider: WatchProviderItem }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-2.5 py-1.5 text-xs font-medium text-on-surface shadow-2xs"
      title={provider.provider_name}
    >
      {provider.logo_path ? (
        <div className="relative h-6 w-6 overflow-hidden rounded-md">
          <Image
            alt={provider.provider_name ?? "Provider"}
            className="object-cover"
            fill
            sizes="24px"
            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
          />
        </div>
      ) : (
        <Tv className="h-4 w-4 text-outline-muted" />
      )}
      <span className="max-w-[120px] truncate">{provider.provider_name}</span>
    </div>
  );
}

export default WhereToWatch;
