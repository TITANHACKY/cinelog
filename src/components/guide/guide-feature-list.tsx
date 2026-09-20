"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Download,
  Film,
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

export const FEATURE_GUIDES: FeatureGuide[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "The Dashboard is your personalized command center. It welcomes you by name, displays real-time counters of your saved movies and series, and dynamically renders interactive collection carousels directly onto your home screen so you can jump straight into your favorite curated streams.",
    tips: [
      "Stats counters for Movies and Series update automatically whenever titles are added, edited, or removed",
      "Enable 'Show in dashboard' on any custom Smart Collection in Settings to surface it as an interactive carousel shelf",
      "Interact directly with carousel cards: tap to view details, toggle watch status, or record quick reactions",
      "When no collection carousels are configured, use the home screen prompt to set up your first smart collection pipeline",
    ],
    screenshot: {
      src: "/mocks/mock-dashboard.png",
      alt: "CineLog Dashboard — personalized welcome, library counters, and custom collection carousels",
      caption:
        "Dashboard home showing personalized welcome, real-time library stats counters, and custom collection stream carousels.",
    },
  },
  {
    icon: Library,
    title: "My Library",
    description:
      "The Library houses your entire personal cinema catalog. Seamlessly switch between dedicated Movies and Series tabs, execute real-time title searches, build multi-criteria filter rules, sort with precision, and group titles into clear visual clusters.",
    tips: [
      "Switch between Movies and TV Series tabs to view isolated collections with live item count badges",
      "Filter your collection across multiple dimensions: Origin Country, Genre, Release Year, Watch Status, and Rating with flexible operators (Equals, Contains, Greater Than)",
      "Organize your titles with dynamic sorting by Rating (highest/lowest), Release Date, Date Added, or Alphabetical title",
      "Group titles into collapsible visual categories by Genre, Release Decade/Year, or Watch Status",
      "Switch from manual browsing to any active Smart Collection view using the Collection dropdown",
      "Each poster card features release year, TMDB rating, language/country, and 1-click status & reaction toggles in the card footer",
    ],
    screenshot: {
      src: "/mocks/mock-library.png",
      alt: "CineLog Library — filterable grid, sorting, grouping, and card status actions",
      caption:
        "My Library view featuring media tabs, live search, multi-condition filters, sorting, grouping, and interactive movie cards.",
    },
  },
  {
    icon: Search,
    title: "Search & Discover",
    description:
      "Explore TMDB's catalog of 800,000+ movies and TV series with the global search dialog. Access it instantly via keyboard shortcut or the floating action button, filter by year and language, and add titles directly to your watchlist with a single click.",
    tips: [
      "Open search from anywhere with the ⌘K (Mac) or Ctrl+K (Windows/Linux) shortcut, or click the floating search button in the bottom right",
      "Switch between Movies and Series tabs to narrow your search query scope",
      "Filter search results by Release Year and Spoken Language dropdowns",
      "Result cards showcase high-res posters, release year, star ratings, primary genre tags, audio language, and plot synopses",
      "Add titles directly to your watchlist or mark them as completed with one click without leaving the search dialog",
      "Page through results smoothly using previous/next pagination controls",
    ],
    screenshot: {
      src: "/mocks/mock-search.png",
      alt: "CineLog Search & Discover dialog — real-time TMDB query, media filters, and quick-add actions",
      caption:
        "Search dialog with instant debounced TMDB catalog search, media type filters, year and language selectors, and 1-click watchlist toggles.",
    },
  },
  {
    icon: Film,
    title: "Title Details",
    description:
      "Every title features an immersive cinematic presentation with a full-bleed backdrop hero, high-resolution poster artwork, metadata tags, and deep production specifications. Take immediate actions, log impressions, browse cast & crew, and discover related titles.",
    tips: [
      "Hero bar displays media type, release year, runtime, age certification (e.g. UA), release status, and official tagline",
      "Use the action bar to toggle watchlist status, share title links, update watch progress (Plan to Watch, In Progress, Completed, Dropped), or log reactions",
      "Reference external TMDB ID and IMDB ID links for verified cross-platform database info",
      "Detailed specifications include age rating, runtime, audio tracks, narrative synopsis, original creator, and lead studio",
      "Explore the Cast & Key Crew gallery with high-res headshots, actor names, and character roles",
      "Click any genre pill to quickly discover similar cinema in your library",
    ],
    screenshot: {
      src: "/mocks/mock-title-details.png",
      alt: "CineLog Title Detail — backdrop hero, specifications, reactions, action bar, and cast grid",
      caption:
        "Title detail page featuring backdrop hero, comprehensive metadata, action bar (watchlist, status, share, reactions), specifications, and cast & crew gallery.",
    },
  },
  {
    icon: ListFilter,
    title: "Smart Collections",
    description:
      "Smart Collections are dynamic, rule-based playlists that automatically update as your library evolves. Construct multi-clause filter pipelines with AND logic, assign custom sorting and grouping, and toggle their appearance on your library dropdown or dashboard carousels.",
    tips: [
      "Manage and create collections under System Preferences → Smart Collections tab",
      "Drag and drop collections using the handle (⋮⋮) to reorder how they appear throughout CineLog",
      "Build compound filter pipelines with up to 3 simultaneous rules (AND logic) across Genre, Origin Country, Release Year, Vote Average, and Watch Status",
      "Select custom sort orders (e.g. Date Added Newest, Rating Highest) and grouping categories (e.g. Group by Watch Status)",
      "Toggle 'Show in library' to access the collection from the library dropdown",
      "Toggle 'Show in dashboard' to display the collection as an automated horizontal stream carousel on your home page",
      "Pause or activate individual collections anytime using the toggle switch without deleting your rules",
    ],
    screenshot: {
      src: "/mocks/mock-smart-collections.png",
      alt: "CineLog Smart Collections Builder — rule pipelines, filters, sort, group, and display toggles",
      caption:
        "Smart Collections builder showing multi-condition filter pipelines (AND logic), sorting, grouping, drag-and-drop reordering, and display toggles for library & dashboard.",
    },
  },
  {
    icon: Star,
    title: "Impressions & Reactions",
    description:
      "Express and track your sentiment for every movie and show. Choose between three reaction levels — Dislike, Like, and Love — available directly from title detail hero headers or straight from poster card footers in the library grid.",
    tips: [
      "Three sentiment tiers: Dislike (thumbs down), Like (thumbs up), and Love (heart)",
      "Log reactions instantly from the library grid by hovering or clicking the reaction button on any card footer without opening the title page",
      "Log or update reactions on any title's detail page via the dedicated action bar pill",
      "Active reactions are visually highlighted with color-coded badges on cards",
      "Create Smart Collections targeting titles you 'Love' to generate an auto-updating favorite films shelf",
      "You can modify or clear your reaction at any time",
    ],
    screenshots: [
      {
        src: "/mocks/mock-reaction-2.png",
        alt: "CineLog Reaction Popover — contextual sentiment picker on library poster cards",
        caption:
          "Contextual reaction popover directly on library poster cards for instant sentiment logging without leaving the grid.",
      },
      {
        src: "/mocks/mock-impressions-reactions.png",
        alt: "CineLog Action Bar Reactions — sentiment pill on title detail pages",
        caption:
          "Action bar reaction sentiment pill (Dislike, Like, Love) on title detail pages.",
      },
    ],
  },
  {
    icon: Download,
    title: "Install as PWA",
    description:
      "CineLog is built as a Progressive Web App (PWA), providing a fast, distraction-free native application experience on macOS, Windows, Linux, iOS, and Android without requiring an app store download.",
    tips: [
      "Look for the floating 'Install CineLog App' prompt banner and click 'Install' for one-click setup",
      "Desktop browsers (Chrome, Edge, Brave): Click the install icon in the URL address bar or select Install from the browser menu",
      "iOS Safari: Tap the Share button, select 'Add to Home Screen', and tap 'Add'",
      "Android Chrome: Tap the three-dot menu (⋮) and select 'Install app' or 'Add to Home Screen'",
      "Enjoy a dedicated standalone window with no browser tabs, search bars, or browser clutter",
      "Offline caching via background service worker ensures ultra-fast page loads and smooth navigation",
    ],
    screenshot: {
      src: "/mocks/mock-install-pwa.png",
      alt: "CineLog PWA Installation banner — one-click app installation prompt",
      caption:
        "Progressive Web App installation prompt for desktop and mobile home screen installation.",
    },
  },
  {
    icon: Settings,
    title: "Settings & Preferences",
    description:
      "Configure your CineLog environment, manage account identity, update security credentials, and organize custom collection pipelines through a unified System Preferences interface.",
    tips: [
      "Quickly toggle between the 'Smart Collections' tab and 'User Profile & Credentials' tab",
      "Update your unique username and account notification email address",
      "Set an optional Display Name to personalize your Dashboard greeting and profile header",
      "Change your account password securely: enter your current password, new password, and confirmation",
      "Passwords enforce secure requirements: 6–20 characters with uppercase, lowercase, numbers, and allowed special characters (@ # & ! _)",
      "Changes take effect immediately across all CineLog surfaces upon saving",
    ],
    screenshot: {
      src: "/mocks/mock-settings.png",
      alt: "CineLog Settings — User Profile & Credentials management",
      caption:
        "User Profile & Credentials configuration: update username, email, display name, and secure password updates.",
    },
  },
];

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
        <div className="flex min-w-0 flex-1 items-center">
          <span className="font-public-sans text-sm font-semibold text-on-surface sm:text-base">
            {title}
          </span>
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

            {items.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
                  Screenshots & Preview
                </p>
                <div
                  className={`grid gap-3 ${
                    items.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {items.map((img, idx) => (
                    <figure
                      key={img.src + idx}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-sm"
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
                          className="object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-[1.01]"
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
                        <figcaption className="mt-auto border-t border-outline-variant/60 bg-surface-container-low/70 px-3.5 py-2">
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

function GuideScreenshotModal({
  image,
  onClose,
}: {
  image: GuideScreenshot;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-4 py-3 sm:px-6">
          <span className="font-public-sans text-xs font-medium text-secondary sm:text-sm">
            {image.alt}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close image preview"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="relative aspect-video w-full flex-1 bg-surface-container-lowest">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-contain"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
        {image.caption && (
          <div className="border-t border-outline-variant/60 bg-surface-container px-4 py-3 sm:px-6">
            <p className="font-public-sans text-xs text-secondary sm:text-sm">
              {image.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function GuideFeatureList({ className }: { className?: string }) {
  const [activeModalImage, setActiveModalImage] =
    useState<GuideScreenshot | null>(null);

  return (
    <>
      <div className={className ?? "flex flex-col gap-3"}>
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

      {activeModalImage && (
        <GuideScreenshotModal
          image={activeModalImage}
          onClose={() => setActiveModalImage(null)}
        />
      )}
    </>
  );
}
