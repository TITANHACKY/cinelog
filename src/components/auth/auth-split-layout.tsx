"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Clapperboard, Film, Sparkles, Star } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthSplitLayoutProps {
  children: ReactNode;
}

const HIGHLIGHTS = [
  {
    icon: Film,
    title: "Catalog Tracking",
    description: "Thousands of titles",
  },
  {
    icon: Bookmark,
    title: "Custom Lists",
    description: "Organize watchlists",
  },
  {
    icon: Star,
    title: "Personal Log",
    description: "Ratings & reviews",
  },
];

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface lg:h-screen lg:max-h-screen lg:overflow-hidden lg:grid lg:grid-cols-12">
      {/* Left Column - Branding & Clear Atmospheric Cinema Background */}
      <div className="relative flex flex-col justify-between overflow-hidden border-b border-outline-alt bg-zinc-950 p-3.5 pt-4 pb-3 sm:p-8 lg:col-span-6 lg:h-full lg:max-h-screen lg:border-b-0 lg:border-r lg:p-8 lg:pb-8 xl:col-span-7 xl:p-10 xl:pb-10">
        {/* Clear Cinema Background Image without overexposed white fading */}
        <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
          <Image
            src="/auth_backdrop.jpg"
            alt="Atmospheric cinema hall"
            fill
            priority
            className="object-cover object-center opacity-85 scale-100"
          />
          {/* Subtle Dark Vignette for Pristine Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/50" />
        </div>

        {/* Top Branding Section with Logo & Name */}
        <header className="relative z-10 flex items-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 sm:gap-3.5 transition-transform duration-200 active:scale-95"
            aria-label="CineLog Home"
          >
            <div className="relative size-9 sm:size-12 lg:size-14 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border border-white/20 bg-black/45 p-1.5 sm:p-2 shadow-lg backdrop-blur-md transition-all group-hover:border-white/40 group-hover:bg-black/60">
              <Image
                src="/logo_dark.svg"
                alt="CineLog Logo"
                fill
                priority
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                CineLog
              </span>
            </div>
          </Link>
        </header>

        {/* Catch Phrase & Narrative - Ultra-compact on mobile, rich on desktop */}
        <div className="relative z-10 my-1 sm:my-auto py-1 sm:py-4 lg:py-6">
          <div className="max-w-xl space-y-1.5 sm:space-y-4">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300 backdrop-blur-md shadow-sm">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Your Personal Cinema Sanctuary</span>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <h1 className="font-heading text-sm sm:text-2xl xl:text-4xl font-extrabold tracking-tight text-white leading-snug sm:leading-tight drop-shadow-md">
                Every frame, every story, logged your way.
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-zinc-200/90 leading-relaxed max-w-lg drop-shadow-sm">
                Immerse yourself in films and television. Track everything you watch,
                build aesthetic custom watchlists, and relive your cinema journey with ease.
              </p>
            </div>

            {/* Feature Highlights Grid - Hidden on mobile to keep form directly accessible without scrolling */}
            <div className="hidden sm:grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-white/40 bg-white/80 p-2.5 shadow-md backdrop-blur-md transition-all duration-200 hover:border-white/60 hover:bg-white/90 dark:border-white/15 dark:bg-black/45 dark:shadow-sm dark:hover:border-white/30 dark:hover:bg-black/60"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-brand-primary/25 bg-brand-primary/10 text-brand-primary shadow-xs dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-300">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900 transition-colors dark:text-white">
                      {title}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-tight text-slate-600 transition-colors dark:text-zinc-300">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info on left column - High-Contrast & Safe Bottom Clearance */}
        <footer className="relative z-10 hidden items-center justify-between border-t border-white/15 pt-4 pb-2 text-xs text-zinc-400 lg:flex">
          <span className="flex items-center gap-1.5">
            <Clapperboard className="size-3.5 text-amber-400" />
            Curated for movie lovers
          </span>
          <span>© {new Date().getFullYear()} CineLog</span>
        </footer>
      </div>

      {/* Right Column - Centered Form with Theme Toggle at bottom right */}
      <div className="relative flex flex-col justify-between overflow-y-auto p-3 sm:p-6 lg:col-span-6 lg:h-full lg:max-h-screen lg:p-8 xl:col-span-5 xl:p-10">
        <div className="hidden lg:block h-2" aria-hidden="true" />

        {/* Middle Centered Form Container */}
        <main className="my-auto flex w-full flex-1 items-center justify-center py-2 sm:py-6">
          <div className="w-full max-w-md">
            <div className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low/90 p-4 sm:p-7 shadow-xl backdrop-blur-xl">
              {children}
            </div>

            {/* Theme toggle below the form, aligned to the right */}
            <div className="mt-2.5 flex items-center justify-end">
              <ThemeToggle />
            </div>
          </div>
        </main>

        {/* Bottom subtle note */}
        <div className="hidden sm:block text-center text-xs text-outline-muted py-1">
          <span>Protected by secure session authentication</span>
        </div>
      </div>
    </div>
  );
}
