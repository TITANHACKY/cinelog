"use client";

import { useState } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { useAppDispatch, useAppSelector } from "@/store";
import { signupRequest } from "@/store/slices/authSlice";
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles, User } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

function ErrorList({ error }: { error?: FieldError }) {
  if (!error) return null;

  if (error.types) {
    const messages = Object.values(error.types).flat();
    return (
      <ul className="mt-1 space-y-0.5 text-[11px] sm:text-xs text-status-error">
        {messages.map((msg, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-status-error shrink-0" />
            <span>{String(msg)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <span className="mt-1 inline-block text-[11px] sm:text-xs font-medium text-status-error">
      {error.message}
    </span>
  );
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    criteriaMode: "all",
  });

  const onSubmit = (data: SignupInput) => {
    dispatch(signupRequest(data));
  };

  return (
    <div className="flex w-full flex-col gap-3.5 sm:gap-6">
      <div className="space-y-0.5 sm:space-y-1.5 text-center">
        <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-on-surface">
          Create an account
        </h2>
        <p className="text-xs sm:text-sm text-secondary">
          Join CineLog and start logging your cinematic journey
        </p>
      </div>

      {error ? <AlertBanner message={error} variant="error" /> : null}

      <form className="flex flex-col gap-2.5 sm:gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          error={<ErrorList error={errors.username} />}
          id="username"
          label="Username"
        >
          <div className="relative">
            <Input
              {...register("username")}
              className="h-9 sm:h-10.5 border-outline-alt bg-surface-container/70 pl-8.5 sm:pl-9.5 pr-3 text-xs sm:text-sm focus-visible:bg-surface-container"
              id="username"
              placeholder="cinelover"
              autoComplete="username"
              required
            />
            <User className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-outline-muted" />
          </div>
        </FormField>

        <FormField
          error={<ErrorList error={errors.email} />}
          id="email"
          label="Email address"
        >
          <div className="relative">
            <Input
              {...register("email")}
              className="h-9 sm:h-10.5 border-outline-alt bg-surface-container/70 pl-8.5 sm:pl-9.5 pr-3 text-xs sm:text-sm focus-visible:bg-surface-container"
              id="email"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
            <Mail className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-outline-muted" />
          </div>
        </FormField>

        <FormField
          error={<ErrorList error={errors.displayName} />}
          id="displayName"
          label={
            <div className="flex items-center justify-between w-full">
              <span>Display Name</span>
              <span className="text-[10px] sm:text-xs font-normal text-outline-muted">Optional</span>
            </div>
          }
        >
          <div className="relative">
            <Input
              {...register("displayName")}
              className="h-9 sm:h-10.5 border-outline-alt bg-surface-container/70 pl-8.5 sm:pl-9.5 pr-3 text-xs sm:text-sm focus-visible:bg-surface-container"
              id="displayName"
              placeholder="Your public name"
              autoComplete="name"
            />
            <Sparkles className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-outline-muted" />
          </div>
        </FormField>

        <FormField
          error={<ErrorList error={errors.password} />}
          id="password"
          label="Password"
        >
          <div className="relative">
            <Input
              {...register("password")}
              className="h-9 sm:h-10.5 border-outline-alt bg-surface-container/70 pl-8.5 sm:pl-9.5 pr-9 sm:pr-10 text-xs sm:text-sm focus-visible:bg-surface-container"
              id="password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
            />
            <Lock className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-outline-muted" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-outline-muted transition-colors hover:text-on-surface focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-3.5 sm:size-4" />
              ) : (
                <Eye className="size-3.5 sm:size-4" />
              )}
            </button>
          </div>
        </FormField>

        <Button
          className="mt-1 sm:mt-2 h-9.5 sm:h-10.5 w-full text-xs sm:text-sm font-medium shadow-sm transition-all"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-3.5 sm:size-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-center text-xs sm:text-sm text-secondary">
        <span>Already have an account?</span>
        <Link
          className="font-medium text-brand-primary hover:underline underline-offset-4"
          href="/login"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
