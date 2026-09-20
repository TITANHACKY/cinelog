"use client";

import { Check, type LucideIcon } from "lucide-react";

export function SelectableCard({
  title,
  description,
  selected,
  onSelect,
  Icon,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  Icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-11 w-full cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-brand-primary bg-brand-primary-container/15"
          : "border-outline-variant bg-surface-container hover:border-outline-alt"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 font-public-sans text-sm font-medium text-on-surface">
          {Icon ? <Icon className="h-4 w-4 text-brand-primary" /> : null}
          {title}
        </span>
        {selected ? <Check className="h-4 w-4 text-brand-primary" /> : null}
      </div>
      {description ? (
        <span className="font-public-sans text-xs text-secondary">
          {description}
        </span>
      ) : null}
    </button>
  );
}
