"use client";

export function OnboardingProgress({
  steps,
  current,
}: {
  steps: number;
  current: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps}
        aria-valuenow={current + 1}
        aria-label={`Step ${current + 1} of ${steps}`}
      >
        {Array.from({ length: steps }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= current ? "bg-brand-primary" : "bg-surface-container-high"
            }`}
          />
        ))}
      </div>
      <p aria-live="polite" className="font-public-sans text-xs text-secondary">
        Step {current + 1} of {steps}
      </p>
    </div>
  );
}
