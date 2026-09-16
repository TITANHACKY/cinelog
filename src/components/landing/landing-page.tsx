"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  Film,
  Library,
  ListFilter,
  Search,
  Smartphone,
  Sparkles,
  Star,
  Tv,
  UserPlus,
} from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { ButtonLink } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

/* ── Scroll reveal hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const children = el.querySelectorAll(".landing-reveal");
    for (const child of children) observer.observe(child);

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ── Feature data ── */
const FEATURES = [
  {
    icon: Library,
    title: "Personal Library",
    description:
      "Save movies & series to your watchlist. Track what you've seen, what you're watching, and what's next.",
    color: "text-brand-primary",
    bg: "bg-brand-primary-container/15",
    border: "border-brand-primary/20",
  },
  {
    icon: ListFilter,
    title: "Smart Collections",
    description:
      "Build custom filter-driven collections with auto-updating query pipelines that keep your lists fresh.",
    color: "text-brand-tertiary",
    bg: "bg-brand-tertiary-container/15",
    border: "border-brand-tertiary/20",
  },
  {
    icon: Search,
    title: "Powerful Search",
    description:
      "Search TMDB's catalog of thousands of titles. Filter by genre, year, rating, and more.",
    color: "text-status-info",
    bg: "bg-status-info/10",
    border: "border-status-info/20",
  },
  {
    icon: Star,
    title: "Rate & React",
    description:
      "Log personal impressions — like, love, dislike — and track your viewing journey over time.",
    color: "text-status-success",
    bg: "bg-status-success/10",
    border: "border-status-success/20",
  },
];

/* ── Steps data ── */
const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your free account in seconds. No credit card required.",
  },
  {
    number: "02",
    icon: Search,
    title: "Discover & Add",
    description:
      "Search titles from TMDB's massive catalog and build your personal watchlist.",
  },
  {
    number: "03",
    icon: Bookmark,
    title: "Track & Enjoy",
    description:
      "Rate films, organize collections, and relive your cinema journey.",
  },
];

/* ── FAQ data ── */
const FAQ_ITEMS = [
  {
    question: "Is CineLog free to use?",
    answer:
      "Yes! CineLog is completely free. Create an account, build your library, and track your watching journey at no cost.",
  },
  {
    question: "Where does the movie data come from?",
    answer:
      "CineLog uses The Movie Database (TMDB) API to provide comprehensive information about movies and TV series, including cast, crew, ratings, and more.",
  },
  {
    question: "Can I install CineLog on my phone?",
    answer:
      "Absolutely! CineLog is a Progressive Web App (PWA). You can install it directly from your browser on any device — no app store needed.",
  },
  {
    question: "How are Smart Collections different from regular lists?",
    answer:
      "Smart Collections use filter-driven query pipelines that automatically update. Define rules like genre, rating, or watch status and your collection stays current without manual curation.",
  },
  {
    question: "Is my data synced across devices?",
    answer:
      "Yes. Your library, ratings, impressions, and collections are stored securely in the cloud and sync instantly across all your devices.",
  },
];

/* ── Preview images ── */
const PREVIEWS = [
  {
    src: "/mockup_dashboard.jpg",
    alt: "CineLog Dashboard — personalized welcome, stats, and continue watching",
    label: "Dashboard",
  },
  {
    src: "/mockup_library.jpg",
    alt: "CineLog Search - Search for movies and series",
    label: "Search",
  },
  {
    src: "/mockup_library.jpg",
    alt: "CineLog Library — filterable grid of your saved movies and series",
    label: "Library",
  },
  {
    src: "/mockup_detail.jpg",
    alt: "CineLog Movie Detail — hero header with poster, metadata, cast and crew",
    label: "Title Detail",
  },
];

/* ── FAQ Item ── */
function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low transition-colors hover:bg-surface-container">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
        aria-expanded={open}
      >
        <span className="font-public-sans text-sm font-semibold text-on-surface sm:text-base">
          {question}
        </span>
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
          <p className="px-4 pb-4 font-public-sans text-sm leading-relaxed text-secondary sm:px-5 sm:pb-5">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Landing Page ── */
export function LandingPage() {
  const scrollRef = useScrollReveal();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === "dark" : true;
  const [activePreview, setActivePreview] = useState(0);

  return (
    <div ref={scrollRef} className="min-h-screen bg-surface text-on-surface">
      <LandingNav />

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16 sm:px-6">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
          <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-brand-primary-container/8 blur-[100px] landing-glow" />
          <div className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-brand-tertiary-container/8 blur-[100px] landing-glow" />
          <div className="absolute left-1/2 top-0 h-[600px] w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-outline-variant/30 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Badge */}
          <div className="landing-hero-enter inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary-container/10 px-3 py-1 text-xs font-semibold text-brand-primary">
            <Sparkles className="size-3.5" />
            <span>Your Personal Cinema Sanctuary</span>
          </div>

          {/* Headline */}
          <h1 className="landing-hero-enter-delay mt-6 font-heading text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl md:text-6xl lg:text-7xl">
            Every frame, every story,{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-tertiary bg-clip-text text-transparent">
              logged your way.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="landing-hero-enter-delay-2 mt-5 max-w-2xl font-public-sans text-base leading-relaxed text-secondary sm:text-lg">
            Track movies & TV series, build aesthetic custom watchlists, rate
            what you love, and relive your cinema journey — all in one
            beautifully crafted app.
          </p>

          {/* CTAs */}
          <div className="landing-hero-enter-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <ButtonLink
              href="/signup"
              variant="primaryFilled"
              className="h-11 gap-2 px-6 text-sm font-semibold shadow-lg shadow-brand-primary-container/25 sm:h-12 sm:px-8 sm:text-base"
            >
              <UserPlus className="size-4 sm:size-5" />
              Get Started Free
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="darkFilled"
              className="h-11 gap-2 px-6 text-sm font-semibold sm:h-12 sm:px-8 sm:text-base"
            >
              Log In
              <ChevronRight className="size-4" />
            </ButtonLink>
          </div>

          {/* Trust bar */}
          <div className="landing-hero-enter-delay-3 mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-outline-muted sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Film className="size-3.5" />
              800,000+ titles
            </span>
            <span className="hidden size-1 rounded-full bg-outline-muted sm:block" />
            <span className="flex items-center gap-1.5">
              <Tv className="size-3.5" />
              Movies & Series
            </span>
            <span className="hidden size-1 rounded-full bg-outline-muted sm:block" />
            <span className="flex items-center gap-1.5">
              <Smartphone className="size-3.5" />
              Install as PWA
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 landing-fade-in">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-outline-variant p-1">
            <div className="h-1.5 w-1 animate-bounce rounded-full bg-secondary" />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section
        id="features"
        className="relative px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="landing-reveal text-center">
            <p className="font-public-sans text-xs font-semibold uppercase tracking-[0.15em] text-brand-primary">
              Core Features
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Everything you need to track your cinema
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-public-sans text-sm leading-relaxed text-secondary sm:text-base">
              CineLog gives you the tools to organize, discover, and enjoy your
              movie and series collection like never before.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`landing-reveal landing-stagger-${i + 1} group rounded-2xl border ${feature.border} ${feature.bg} p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-7`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${feature.bg} ${feature.color} border ${feature.border}`}
                >
                  <feature.icon className="size-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-on-surface">
                  {feature.title}
                </h3>
                <p className="mt-2 font-public-sans text-sm leading-relaxed text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ APP PREVIEW ═══ */}
      <section
        id="preview"
        className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary-container/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="landing-reveal text-center">
            <p className="font-public-sans text-xs font-semibold uppercase tracking-[0.15em] text-brand-tertiary">
              App Preview
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              See CineLog in action
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-public-sans text-sm leading-relaxed text-secondary sm:text-base">
              A glimpse of the polished, feature-rich experience waiting for you.
            </p>
          </div>

          {/* Preview tabs */}
          <div className="landing-reveal mt-10 flex justify-center gap-2">
            {PREVIEWS.map((preview, i) => (
              <button
                key={preview.label}
                type="button"
                onClick={() => setActivePreview(i)}
                className={`rounded-lg px-3.5 py-2 font-public-sans text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  activePreview === i
                    ? "bg-brand-primary-container/20 text-brand-primary border border-brand-primary/30"
                    : "text-secondary hover:bg-surface-container hover:text-on-surface border border-transparent"
                }`}
              >
                {preview.label}
              </button>
            ))}
          </div>

          {/* Preview image */}
          <div className="landing-reveal mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-2xl sm:rounded-2xl">
            <div className="relative aspect-video w-full">
              <Image
                src={PREVIEWS[activePreview].src}
                alt={PREVIEWS[activePreview].alt}
                fill
                className="object-cover object-top transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section
        id="how-it-works"
        className="px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal text-center">
            <p className="font-public-sans text-xs font-semibold uppercase tracking-[0.15em] text-status-success">
              How It Works
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Get started in three simple steps
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`landing-reveal landing-stagger-${i + 1} relative flex flex-col items-center text-center`}
              >
                {/* Step number */}
                <div className="flex size-14 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-low text-2xl font-bold text-brand-primary shadow-sm">
                  {step.number}
                </div>
                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+40px)] top-7 hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-outline-variant to-transparent sm:block" />
                )}
                <div className="mt-5 flex size-9 items-center justify-center rounded-lg bg-brand-primary-container/10 text-brand-primary">
                  <step.icon className="size-4.5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-3 font-heading text-lg font-semibold text-on-surface">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs font-public-sans text-sm leading-relaxed text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ FAQ ═══ */}
      <section id="faq" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="landing-reveal text-center">
            <p className="font-public-sans text-xs font-semibold uppercase tracking-[0.15em] text-brand-primary">
              FAQ
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="landing-reveal">
                <FaqItem question={item.question} answer={item.answer} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="landing-reveal relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary-container/10 via-surface-container to-brand-tertiary-container/10 p-8 text-center shadow-xl sm:p-14">
            {/* Glow effects */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-primary-container/15 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-brand-tertiary-container/15 blur-[80px]" />

            <div className="relative z-10">
              <Sparkles className="mx-auto size-8 text-brand-tertiary" />
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                Your cinema journey starts here
              </h2>
              <p className="mx-auto mt-3 max-w-lg font-public-sans text-sm leading-relaxed text-secondary sm:text-base">
                Join CineLog and start tracking your movies and series today.
                It&apos;s free, beautiful, and built for movie lovers.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink
                  href="/signup"
                  variant="primaryFilled"
                  className="h-11 gap-2 px-7 text-sm font-semibold shadow-lg shadow-brand-primary-container/25 sm:h-12 sm:px-8 sm:text-base"
                >
                  <UserPlus className="size-4 sm:size-5" />
                  Create Free Account
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  variant="darkFilled"
                  className="h-11 gap-2 px-6 text-sm font-semibold sm:h-12 sm:px-8 sm:text-base"
                >
                  Log In
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-outline-alt px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative size-8 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={isDark ? "/logo_dark.svg" : "/logo_light.svg"}
                  alt="CineLog Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-on-surface">
                CineLog
              </span>
            </Link>
            <p className="max-w-xs text-center font-public-sans text-xs leading-relaxed text-secondary sm:text-left">
              Your personal movie log. Track, rate, and organize everything you
              watch.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex gap-10 sm:gap-14">
            <div className="flex flex-col gap-2.5">
              <p className="font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
                Product
              </p>
              <a
                href="#features"
                className="font-public-sans text-sm text-secondary transition-colors hover:text-on-surface"
              >
                Features
              </a>
              <a
                href="#preview"
                className="font-public-sans text-sm text-secondary transition-colors hover:text-on-surface"
              >
                Preview
              </a>
              <a
                href="#faq"
                className="font-public-sans text-sm text-secondary transition-colors hover:text-on-surface"
              >
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
                Account
              </p>
              <Link
                href="/login"
                className="font-public-sans text-sm text-secondary transition-colors hover:text-on-surface"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="font-public-sans text-sm text-secondary transition-colors hover:text-on-surface"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* TMDB attribution */}
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
              Data provided by
            </p>
            <Image
              src="/tmdb_logo.svg"
              alt="TMDB Logo"
              width={80}
              height={20}
              className="opacity-60 transition-opacity hover:opacity-100"
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mx-auto mt-8 max-w-6xl border-t border-outline-alt pt-6 text-center">
          <p className="font-public-sans text-xs text-outline-muted">
            © {new Date().getFullYear()} CineLog. Built for movie lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}
