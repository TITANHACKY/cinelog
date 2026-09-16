"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  Download,
  Film,
  LayoutDashboard,
  Library,
  ListFilter,
  Search,
  Settings,
  Smartphone,
  Star,
} from "lucide-react";

/* ── Preview data ── */
const PREVIEWS = [
  {
    src: "/mockup_dashboard.jpg",
    alt: "CineLog Dashboard — personalized welcome, stats, and continue watching",
    label: "Dashboard",
    description:
      "Your home base. See a personalized welcome, quick stats on your movie and series count, and pick up where you left off with Continue Watching.",
  },
  {
    src: "/mockup_library.jpg",
    alt: "CineLog Library — filterable grid of your saved movies and series",
    label: "Library",
    description:
      "Your entire watchlist in one place. Filter by movies or series, search by title, apply advanced filters, or group by status, genre, or year.",
  },
  {
    src: "/mockup_detail.jpg",
    alt: "CineLog Movie Detail — hero header with poster, metadata, cast and crew",
    label: "Title Detail",
    description:
      "Dive deep into any title. See the cinematic hero header, genre pills, runtime, rating, and full cast & crew. Add to your watchlist or log your impression.",
  },
];

/* ── Feature guide data ── */
const FEATURE_GUIDES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "The Dashboard is your personalized home. It greets you by name, shows your library stats at a glance, and surfaces titles you're currently watching so you can jump right back in.",
    tips: [
      "Your movie and series counts update in real-time as you add titles",
      "The \"Continue Watching\" section shows titles with in-progress status",
    ],
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
  },
];

/* ── Navigation overview ── */
const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    description: "Home screen with welcome, stats, and continue watching",
  },
  {
    icon: Library,
    label: "My Library",
    path: "/library",
    description: "Your saved movies & series with filters and grouping",
  },
  {
    icon: BookOpen,
    label: "Guide",
    path: "/guide",
    description: "This page — app walkthrough and feature tutorials",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    description: "Custom collections, profile, and preferences",
  },
];

/* ── Expandable section ── */
function ExpandableGuide({
  icon: Icon,
  title,
  description,
  tips,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  tips: string[];
}) {
  const [open, setOpen] = useState(false);

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
        <div className="min-w-0 flex-1">
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
          <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
            <p className="font-public-sans text-sm leading-relaxed text-secondary">
              {description}
            </p>
            {tips.length > 0 && (
              <div className="space-y-1.5">
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
  const [activePreview, setActivePreview] = useState(0);

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 py-6 sm:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8 sm:gap-10">
        {/* Header */}
        <header className="space-y-2 border-b border-outline-alt/60 pb-6">
          <p className="font-mono text-[11px] font-semibold tracking-wider text-outline-muted uppercase sm:text-xs">
            GUIDE &gt; APP WALKTHROUGH
          </p>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-4xl">
              CineLog Guide
            </h1>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Explore features, learn what each section does, and get the most
              out of your cinema tracking experience.
            </p>
          </div>
        </header>

        {/* ── App Preview Section ── */}
        <section className="space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
              App Preview
            </h2>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Visual walkthrough of CineLog&apos;s main screens.
            </p>
          </div>

          {/* Preview tabs */}
          <div className="flex flex-wrap gap-2">
            {PREVIEWS.map((preview, i) => (
              <button
                key={preview.label}
                type="button"
                onClick={() => setActivePreview(i)}
                className={`rounded-lg px-3.5 py-2 font-public-sans text-xs font-medium transition-colors sm:text-sm ${
                  activePreview === i
                    ? "bg-brand-primary-container/20 text-brand-primary border border-brand-primary/30"
                    : "text-secondary hover:bg-surface-container hover:text-on-surface border border-transparent"
                }`}
              >
                {preview.label}
              </button>
            ))}
          </div>

          {/* Preview image + description */}
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-lg sm:rounded-2xl">
            <div className="relative aspect-video w-full">
              <Image
                src={PREVIEWS[activePreview].src}
                alt={PREVIEWS[activePreview].alt}
                fill
                className="object-cover object-top transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
              />
            </div>
            <div className="p-4 sm:p-5">
              <h3 className="font-heading text-base font-semibold text-on-surface sm:text-lg">
                {PREVIEWS[activePreview].label}
              </h3>
              <p className="mt-1 font-public-sans text-xs leading-relaxed text-secondary sm:text-sm">
                {PREVIEWS[activePreview].description}
              </p>
            </div>
          </div>
        </section>

        {/* ── Navigation Overview ── */}
        <section className="space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
              Where is what?
            </h2>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Quick map of CineLog&apos;s main navigation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NAV_ITEMS.map(({ icon: Icon, label, path, description }) => (
              <div
                key={path}
                className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-container/15 text-brand-primary">
                  <Icon className="size-4.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-public-sans text-sm font-semibold text-on-surface">
                    {label}
                  </p>
                  <p className="mt-0.5 font-public-sans text-xs text-secondary">
                    {description}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-outline-muted">
                    {path}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Tutorials ── */}
        <section className="space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
              Feature Guide
            </h2>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Learn about each feature — expand any section for details and
              tips.
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
              />
            ))}
          </div>
        </section>

        {/* ── PWA Install Guide ── */}
        <section className="space-y-5 pb-4">
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary-container/15 shadow-md sm:size-16">
                <Smartphone className="size-6 text-brand-primary sm:size-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-lg font-bold text-on-surface sm:text-xl">
                  Install CineLog as an app
                </h3>
                <p className="mt-1.5 max-w-xl font-public-sans text-xs leading-relaxed text-secondary sm:text-sm">
                  CineLog works as a Progressive Web App. Install it from your
                  browser for native-like experience. On iOS, tap Share → Add to
                  Home Screen. On Android or desktop, use the install prompt or
                  the browser menu.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
