"use client";

import { GuideFeatureList } from "@/components/guide/guide-feature-list";

export type {
  FeatureGuide,
  GuideScreenshot,
} from "@/components/guide/guide-feature-list";

export function GuidePage() {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 py-6 sm:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 sm:gap-8">
        <header className="space-y-2 border-b border-outline-alt/60 pb-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-4xl">
              CineLog Feature Guide
            </h1>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              Explore features, section walkthroughs, and screenshot previews to get the most out of CineLog.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <GuideFeatureList />
        </section>
      </div>
    </main>
  );
}
