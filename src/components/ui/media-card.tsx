import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FALLBACK_POSTER, MEDIA_CARD_CLASS } from "@/lib/constants";
import { posterUrl } from "@/lib/media/display";

type MediaCardProps = {
  href: string;
  title: string;
  posterPath: string | null | undefined;
  year: string;
  rating: string;
  meta?: string;
  overlay?: ReactNode;
  actions?: ReactNode;
  footerTop?: ReactNode;
  actionsPosition?: "inline" | "below";
  imageLoading?: "eager" | "lazy";
};

export function MediaCard({
  href,
  title,
  posterPath,
  year,
  rating,
  meta,
  overlay,
  actions,
  footerTop,
  actionsPosition = "inline",
  imageLoading = "eager",
}: MediaCardProps) {
  return (
    <Card className={MEDIA_CARD_CLASS}>
      <CardContent className="p-0">
        <Link
          aria-label={`View ${title} details`}
          className="relative block aspect-2/3 overflow-hidden bg-surface-container-low focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-primary"
          href={href}
        >
          <Image
            alt={`${title} poster`}
            className="absolute inset-0 h-full w-full object-cover"
            fill
            loading={imageLoading}
            sizes="(max-width: 640px) 50vw, (max-width: 1720px) 20vw, 240px"
            src={posterUrl(posterPath, FALLBACK_POSTER)}
          />
          <div className="absolute top-3 left-3 flex h-4.5 items-center justify-center rounded-xs border border-outline-variant bg-surface-container-low px-2 py-0.5 shadow-xs">
            <span className="flex items-center justify-center font-public-sans text-[10px] leading-3.75 font-bold text-brand-primary">
              {year}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex h-4.5 max-h-4.75 items-center justify-center rounded-xs border border-outline-variant bg-surface-container px-1.5 py-0.75 shadow-xs">
            <span className="flex items-center justify-center font-public-sans text-[10px] leading-3.75 font-bold text-brand-tertiary">
              ★ {rating}
            </span>
          </div>
          {overlay}
        </Link>
      </CardContent>
      <CardFooter className="flex min-w-0 flex-col gap-2 rounded-none border-0 bg-surface-container-low px-3 py-2.5 text-on-surface sm:px-3.5 sm:py-3">
        {footerTop}
        <div className="flex w-full min-w-0 items-center justify-between gap-2.5">
          <Link
            className="flex min-w-0 flex-1 flex-col justify-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            href={href}
            tabIndex={-1}
          >
            {meta ? (
              <p className="truncate font-public-sans text-[11px] leading-4 text-secondary">
                {meta}
              </p>
            ) : null}
          </Link>
          {actionsPosition === "inline" && actions ? (
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {actions}
            </div>
          ) : null}
        </div>
        {actionsPosition === "below" && actions ? (
          <div className="flex w-full items-center justify-between gap-2 pt-0.5">
            {actions}
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}
