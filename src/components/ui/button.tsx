import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primaryFilled"
  | "accentFilled"
  | "darkFilled"
  | "progressEpisode"
  | "progressSeason"
  | "progressUndo"
  | "darkTonal"
  | "ghost"
  | "dark"
  | "link";

type ButtonSize = "default" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const progressFilledBase =
  "border border-outline-variant bg-surface-container-high hover:bg-surface-container-highest active:bg-surface-container-high";

const variantClasses: Record<ButtonVariant, string> = {
  primaryFilled:
    "border-transparent bg-brand-primary-container text-white hover:bg-brand-primary-container/85 active:bg-brand-primary-container",
  accentFilled:
    "border-transparent bg-brand-primary text-brand-on-primary hover:bg-brand-primary/85",
  darkFilled:
    "border border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
  progressEpisode: `${progressFilledBase} text-status-info`,
  progressSeason: `${progressFilledBase} text-brand-tertiary-accent-alt`,
  progressUndo: `${progressFilledBase} text-on-surface`,
  darkTonal:
    "border border-current/30 bg-current/10 text-brand-primary hover:bg-current/20 hover:text-brand-primary",
  ghost:
    "border border-current/25 bg-current/10 text-secondary hover:bg-current/20 hover:text-on-surface",
  dark: "border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high",
  link: "border-transparent text-brand-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-8 gap-1.5 px-2.5",
  icon: "size-8",
  "icon-xs": "size-6 rounded-md",
  "icon-sm": "size-7 rounded-lg",
  "icon-lg": "size-9",
};

const buttonBaseClass =
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function getButtonClassName({
  className,
  size = "default",
  variant = "primaryFilled",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return cn(
    buttonBaseClass,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

function Button({
  className,
  variant = "primaryFilled",
  size = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={getButtonClassName({ variant, size, className })}
      {...props}
    />
  );
}

function ButtonLink({
  className,
  variant = "primaryFilled",
  size = "default",
  ...props
}: ComponentProps<typeof Link> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <Link
      className={getButtonClassName({ variant, size, className })}
      {...props}
    />
  );
}

export { Button, ButtonLink, getButtonClassName };
export type { ButtonVariant, ButtonSize };
