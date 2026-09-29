"use client";

import { Loader2, Sparkles } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { StepMediaLean } from "@/components/onboarding/steps/step-media-lean";
import { StepGenres } from "@/components/onboarding/steps/step-genres";
import { StepLanguages } from "@/components/onboarding/steps/step-languages";
import { StepEraRating } from "@/components/onboarding/steps/step-era-rating";
import { useContentPreferences } from "@/hooks/settings/use-content-preferences";
import { useDiscoverRowsToggle } from "@/hooks/settings/use-discover-rows-toggle";

export function ContentPreferencesSection() {
  const { draft, actions, isLoading, isSaving, message, save } =
    useContentPreferences();
  const discoverRows = useDiscoverRowsToggle();

  if (isLoading) {
    return (
      <p className="font-public-sans text-sm text-secondary">
        Loading your preferences…
      </p>
    );
  }

  return (
    <section
      aria-labelledby="content-preferences-heading"
      className="w-full space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary-container/20 text-brand-primary">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h2
            className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl"
            id="content-preferences-heading"
          >
            Content Preferences
          </h2>
          <p className="font-public-sans text-xs text-secondary">
            Customize your media format lean, preferred genres, languages, and
            era ratings.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-heading text-sm font-semibold text-on-surface sm:text-base">
            Recommended rows on dashboard
          </span>
          <p className="font-public-sans text-xs text-secondary">
            Trending, genre picks and titles like the ones you&apos;ve finished.
          </p>
        </div>
        <ToggleSwitch
          checked={discoverRows.enabled}
          disabled={discoverRows.isToggling}
          onChange={() => void discoverRows.toggle()}
          title={
            discoverRows.enabled
              ? "Turn off recommended rows"
              : "Turn on recommended rows"
          }
        />
      </div>

      {message ? (
        <AlertBanner
          message={message.text}
          variant={message.type === "success" ? "success" : "error"}
        />
      ) : null}

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="font-public-sans text-sm font-semibold text-on-surface">
            What do you watch
          </h2>
          <StepMediaLean
            chosen
            layout="rowOnDesktop"
            onSelect={actions.setMediaLean}
            value={draft.mediaLean}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-public-sans text-sm font-semibold text-on-surface">
            Genres
          </h2>
          <StepGenres
            selected={draft.genreIds}
            onToggle={actions.toggleGenre}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-public-sans text-sm font-semibold text-on-surface">
            Languages
          </h2>
          <StepLanguages
            selected={draft.languages}
            onToggle={actions.toggleLanguage}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-public-sans text-sm font-semibold text-on-surface">
            Era & Rating
          </h2>
          <StepEraRating
            eras={draft.eras}
            minRating={draft.minRating}
            onToggleEra={actions.toggleEra}
            onSetRating={actions.setMinRating}
          />
        </section>

        <div>
          <Button
            variant="primaryFilled"
            onClick={save}
            disabled={
              isSaving ||
              draft.genreIds.length < 1 ||
              draft.languages.length < 1
            }
            type="button"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save preferences"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
