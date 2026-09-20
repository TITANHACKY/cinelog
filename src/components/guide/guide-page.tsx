"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Download,
  Film,
  ImageIcon,
  LayoutDashboard,
  Library,
  ListFilter,
  Maximize2,
  Search,
  Settings,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";

/* ── Types ── */
export interface GuideScreenshot {
  src: string;
  alt: string;
  caption?: string;
}

export interface FeatureGuide {
  icon: LucideIcon;
  title: string;
  description: string;
  tips: string[];
  screenshot?: GuideScreenshot;
  screenshots?: GuideScreenshot[];
}

/* ── Feature guide data ── */
const FEATURE_GUIDES: FeatureGuide[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "The Dashboard is your personalized home. It greets you by name, shows your library stats at a glance, and surfaces titles you're currently watching so you can jump right back in.",
    tips: [
      "Your movie and series counts update in real-time as you add titles",
      "The \"Continue Watching\" section shows titles with in-progress status",
    ],
    screenshot: {
      src: "/mockup_dashboard.jpg",
      alt: "CineLog Dashboard — personalized welcome, stats, and continue watching",
      caption:
        "Dashboard home showing your cinema tracking metrics and continue watching carousel.",
    },
  },
  {
    icon: Library,
    title: "My Library",
    description:
      "The Library is the heart of CineLog. Every movie and series you save lives here. Switch between Movies and Series tabs, search within your collection, and use advanced filters to find exactly what you need.",
    tips: [
      "Use the Group By control to organize by genre, year, or watch status",
      "Apply multiple filters for precise browsing (e.g. 'Sci-Fi' + 'Watched')",
      "Scroll to load more — the library paginates automatically",
    ],
    screenshot: {
      src: "/mockup_library.jpg",
      alt: "CineLog Library — filterable grid of your saved movies and series",
      caption:
        "Watchlist with filterable tabs, search by title, and multi-criteria grouping.",
    },
  },
  {
    icon: Search,
    title: "Search & Discover",
    description:
      "Press the floating search button or use the keyboard shortcut to open the search dialog. Search TMDB's catalog of 800,000+ titles by name, then filter by genre, year, or media type.",
    tips: [
      "Search results include both movies and TV series",
      "Click any result to view full details and add it to your library",
      "Use the filter dropdown to narrow results by genre or year",
    ],
    // Provision for screenshot sample:
    // screenshot: {
    //   src: "/mockup_search.jpg",
    //   alt: "CineLog Search & Discover dialog",
    //   caption: "Search dialog with live suggestions and TMDB integration.",
    // },
  },
  {
    icon: Film,
    title: "Title Details",
    description:
      "Each title page features a cinematic hero header with the backdrop image, poster, metadata, and genre pills. Below you'll find full specifications (director, budget, revenue, languages) and the cast & crew grid.",
    tips: [
      "Use the action bar to add/remove from watchlist, set watch status, and log your impression",
      "Share titles directly from the share button",
      "Tap genre pills to discover similar titles",
    ],
    screenshot: {
      src: "/mockup_detail.jpg",
      alt: "CineLog Movie Detail — hero header with poster, metadata, cast and crew",
      caption:
        "Title detail page featuring backdrop hero, specifications, reactions, and cast grid.",
    },
  },
  {
    icon: ListFilter,
    title: "Smart Collections",
    description:
      "Smart Collections are filter-driven, auto-updating lists. Define rules based on genre, watch status, rating, or custom criteria, and CineLog keeps the collection current without manual curation.",
    tips: [
      "Create collections from Settings → Custom Collections",
      "Each collection can have multiple filter clauses",
      "Collections update automatically as your library changes",
    ],
    // Provision for screenshot sample:
    // screenshot: {
    //   src: "/mockup_collections.jpg",
    //   alt: "CineLog Smart Collections manager",
    //   caption: "Dynamic rule builder for auto-updating watchlists.",
    // },
  },
  {
    icon: Star,
    title: "Impressions & Reactions",
    description:
      "Log how you feel about every title. Use the reaction buttons (like, love, dislike) on any title's detail page. Your impressions are saved and visible in your library cards.",
    tips: [
      "Impressions are shown as colored indicators on library cards",
      "You can change your impression at any time",
      "Filter your library by impression to find your favorites",
    ],
    // Provision for screenshot sample:
    // screenshot: {
    //   src: "/mockup_impressions.jpg",
    //   alt: "CineLog Impressions & Reactions",
    //   caption: "Sentiment and reaction logging for every watched film.",
    // },
  },
  {
    icon: Download,
    title: "Install as PWA",
    description:
      "CineLog is a Progressive Web App. Install it from your browser for an app-like experience — it works on iOS, Android, and desktop. Look for the install prompt or use your browser's 'Add to Home Screen' option.",
    tips: [
      "On iOS Safari, tap Share → Add to Home Screen",
      "On Android Chrome, tap the three-dot menu → Install app",
      "On desktop Chrome/Edge, look for the install icon in the address bar",
    ],
    // Provision for screenshot sample:
    // screenshot: {
    //   src: "/mockup_pwa.jpg",
    //   alt: "CineLog PWA Installation instructions",
    //   caption: "Install prompts and native web app setup.",
    // },
  },
  {
    icon: Settings,
    title: "Settings",
    description:
      "Configure your CineLog experience. Manage your custom collections with advanced filter pipelines, update your display name, email, and password in User Profile & Credentials.",
    tips: [
      "Use the tabs to switch between Custom Collections and User Profile",
      "Collection filters support nested AND/OR logic",
    ],
    // Provision for screenshot sample:
    // screenshot: {
    //   src: "/mockup_settings.jpg",
    //   alt: "CineLog Settings panel",
    //   caption: "Custom collection filter pipelines and account profile management.",
    // },
  },
];

/* ── Expandable section ── */
function ExpandableGuide({
  icon: Icon,
  title,
  description,
  tips,
  screenshot,
  screenshots,
  onImageClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tips: string[];
  screenshot?: GuideScreenshot;
  screenshots?: GuideScreenshot[];
  onImageClick?: (screenshot: GuideScreenshot) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = screenshots ?? (screenshot ? [screenshot] : []);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low transition-colors hover:bg-surface-container">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
        aria-expanded={open}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-container/15 text-brand-primary">
          <Icon className="size-4.5" strokeWidth={1.8} />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="font-public-sans text-sm font-semibold text-on-surface sm:text-base">
            {title}
          </span>
          {items.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 font-public-sans text-[11px] font-medium text-secondary">
              <ImageIcon className="size-3 text-brand-primary" />
              <span>Preview</span>
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            <p className="font-public-sans text-sm leading-relaxed text-secondary">
              {description}
            </p>

            {/* Screenshots section */}
            {items.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
                  Screenshots & Preview
                </p>
                <div className="grid gap-3 sm:grid-cols-1">
                  {items.map((img, idx) => (
                    <figure
                      key={img.src + idx}
                      className="group relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-sm"
                    >
                      <button
                        type="button"
                        className="relative aspect-video w-full cursor-pointer bg-surface-container-lowest text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                        onClick={() => onImageClick?.(img)}
                        aria-label={`Enlarge screenshot: ${img.alt}`}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-highest/90 px-3 py-1.5 font-public-sans text-xs font-medium text-on-surface shadow-md backdrop-blur-sm">
                            <Maximize2 className="size-3.5" />
                            Click to expand
                          </span>
                        </div>
                      </button>
                      {img.caption && (
                        <figcaption className="border-t border-outline-variant/60 bg-surface-container-low/70 px-3.5 py-2">
                          <p className="font-public-sans text-xs text-secondary">
                            {img.caption}
                          </p>
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {tips.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
                  Tips
                </p>
                <ul className="space-y-1">
                  {tips.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 font-public-sans text-xs leading-relaxed text-secondary"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Guide Page ── */
export function GuidePage() {
  const [activeModalImage, setActiveModalImage] = useState<GuideScreenshot | null>(null);

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 py-6 sm:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 sm:gap-8">
        {/* Header */}
        <header className="space-y-2 border-b border-outline-alt/60 pb-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-4xl">
              CineLog Guide
            </h1>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Explore features, section walkthroughs, and screenshot previews to get the most out of CineLog.
            </p>
          </div>
        </header>

        {/* Feature Guides Section */}
        <section className="space-y-4">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
              Feature Guide
            </h2>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Learn about each feature — expand any section for details, screenshot previews, and tips.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FEATURE_GUIDES.map((guide) => (
              <ExpandableGuide
                key={guide.title}
                icon={guide.icon}
                title={guide.title}
                description={guide.description}
                tips={guide.tips}
                screenshot={guide.screenshot}
                screenshots={guide.screenshots}
                onImageClick={(img) => setActiveModalImage(img)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Screenshot Lightbox Modal */}
      {activeModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setActiveModalImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/60 px-4 py-3 sm:px-6">
              <span className="font-public-sans text-xs font-medium text-secondary sm:text-sm">
                {activeModalImage.alt}
              </span>
              <button
                type="button"
                onClick={() => setActiveModalImage(null)}
                className="rounded-lg p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Close image preview"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full flex-1 bg-surface-container-lowest">
              <Image
                src={activeModalImage.src}
                alt={activeModalImage.alt}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
            {activeModalImage.caption && (
              <div className="border-t border-outline-variant/60 bg-surface-container px-4 py-3 sm:px-6">
                <p className="font-public-sans text-xs text-secondary sm:text-sm">
                  {activeModalImage.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
