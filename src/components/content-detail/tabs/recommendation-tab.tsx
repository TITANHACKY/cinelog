"use client";

import { Sparkles, Wrench } from "lucide-react";

export function RecommendationTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/60 p-8 sm:p-12 text-center backdrop-blur-xs">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
        <Sparkles className="h-7 w-7" />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant">
          <Wrench className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="font-heading text-lg sm:text-xl font-semibold text-on-surface">
        Recommendations Under Development
      </h3>

      <p className="mt-2 max-w-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
        Our personalized movie recommendation engine is currently being
        upgraded. Check back soon for curated suggestions tailored to your
        taste.
      </p>
    </div>
  );
}

export default RecommendationTab;
