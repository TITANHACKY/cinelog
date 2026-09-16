"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogIn, Menu, UserPlus, X } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === "dark" : true;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Preview", href: "#preview" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-outline-alt bg-surface/85 backdrop-blur-xl shadow-[0_1px_3px_rgb(0_0_0/10%)]"
          : "bg-transparent"
      }`}
    >
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-lg sm:size-9">
            <Image
              src={isDark ? "/logo_dark.svg" : "/logo_light.svg"}
              alt="CineLog Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-on-surface sm:text-xl">
            CineLog
          </span>
        </Link>

        {/* Desktop Nav Links - Centered */}
        <nav
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden items-center justify-center gap-0.5 md:flex lg:gap-1"
          aria-label="Landing page navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-2 font-public-sans text-xs font-medium text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface lg:px-3 lg:text-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex lg:gap-3">
          <ThemeToggle />
          <ButtonLink
            href="/login"
            variant="ghost"
            className="gap-1.5 px-3 lg:px-3.5"
          >
            <LogIn className="size-4" />
            Log In
          </ButtonLink>
          <ButtonLink
            href="/signup"
            variant="primaryFilled"
            className="gap-1.5 px-3.5 lg:px-4"
          >
            <UserPlus className="size-4" />
            Sign Up
          </ButtonLink>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex size-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-outline-alt bg-surface/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 font-public-sans text-sm font-medium text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-outline-alt pt-4">
              <ButtonLink
                href="/login"
                variant="ghost"
                onClick={() => setMobileOpen(false)}
                className="justify-center gap-1.5"
              >
                <LogIn className="size-4" />
                Log In
              </ButtonLink>
              <ButtonLink
                href="/signup"
                variant="primaryFilled"
                onClick={() => setMobileOpen(false)}
                className="justify-center gap-1.5"
              >
                <UserPlus className="size-4" />
                Sign Up
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
