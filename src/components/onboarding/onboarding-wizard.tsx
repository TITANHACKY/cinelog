"use client";

import { Loader2 } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { StepMediaLean } from "@/components/onboarding/steps/step-media-lean";
import { StepGenres } from "@/components/onboarding/steps/step-genres";
import { StepLanguages } from "@/components/onboarding/steps/step-languages";
import { StepEraRating } from "@/components/onboarding/steps/step-era-rating";
import { StepTitles } from "@/components/onboarding/steps/step-titles";
import { useOnboardingWizard } from "@/hooks/onboarding/use-onboarding-wizard";

const STEP_TITLES = [
  { title: "How do you watch?", subtitle: "Tell us what you reach for most." },
  { title: "Pick your genres", subtitle: "We use these to tailor CineLog to you." },
  {
    title: "Preferred languages",
    subtitle: "Optional — helps us surface the right titles.",
  },
  { title: "Era & rating", subtitle: "Optional — set the vibe and a quality floor." },
  { title: "Titles you love", subtitle: "Optional — pick a few to seed your taste." },
];

export function OnboardingWizard() {
  const w = useOnboardingWizard();
  const meta = STEP_TITLES[w.stepIndex];
  const isSkippable = w.stepIndex >= 2;

  // Wait for the saved draft to be restored before rendering a step, so we
  // never flash step 1 while resuming a later step on reload.
  if (!w.hydrated) {
    return (
      <div className="relative min-h-dvh">
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-6">
      <OnboardingProgress steps={w.stepCount} current={w.stepIndex} />

      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          {meta.title}
        </h1>
        <p className="font-public-sans text-sm text-secondary">{meta.subtitle}</p>
      </div>

      {w.errorMessage ? (
        <AlertBanner message={w.errorMessage} variant="error" />
      ) : null}

      <div className="flex flex-1 flex-col">
        {w.stepIndex === 0 ? (
          <StepMediaLean
            value={w.draft.mediaLean}
            chosen={w.mediaLeanChosen}
            onSelect={w.actions.setMediaLean}
          />
        ) : null}
        {w.stepIndex === 1 ? (
          <StepGenres
            selected={w.draft.genreIds}
            onToggle={w.actions.toggleGenre}
          />
        ) : null}
        {w.stepIndex === 2 ? (
          <StepLanguages
            selected={w.draft.languages}
            onToggle={w.actions.toggleLanguage}
          />
        ) : null}
        {w.stepIndex === 3 ? (
          <StepEraRating
            eras={w.draft.eras}
            minRating={w.draft.minRating}
            onToggleEra={w.actions.toggleEra}
            onSetRating={w.actions.setMinRating}
          />
        ) : null}
        {w.stepIndex === 4 ? (
          <StepTitles
            genreIds={w.draft.genreIds}
            mediaLean={w.draft.mediaLean}
            languages={w.draft.languages}
            seedTitles={w.draft.seedTitles}
            onAdd={w.actions.addSeedTitle}
            onRemove={w.actions.removeSeedTitle}
          />
        ) : null}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low py-4">
        <Button
          variant="ghost"
          onClick={w.back}
          disabled={w.stepIndex === 0 || w.isSubmitting}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {isSkippable && !w.isLastStep ? (
            <Button variant="ghost" onClick={w.next} disabled={w.isSubmitting}>
              Skip
            </Button>
          ) : null}
          {w.isLastStep ? (
            <Button onClick={w.submit} disabled={w.isSubmitting}>
              {w.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Finish"
              )}
            </Button>
          ) : (
            <Button
              onClick={w.next}
              disabled={!w.canProceed || w.isSubmitting}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
