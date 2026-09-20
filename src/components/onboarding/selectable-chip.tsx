"use client";

import { Check } from "lucide-react";

export function SelectableChip({
  label,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 font-public-sans text-xs transition-colors sm:text-sm ${
        selected
          ? "border-brand-primary bg-brand-primary-container/15 text-on-surface"
          : "border-outline-variant bg-surface-container text-secondary hover:text-on-surface"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      <Check
        aria-hidden
        className={`h-3.5 w-3.5 shrink-0 text-brand-primary ${
          selected ? "visible" : "invisible"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}
