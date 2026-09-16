"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginRequest } from "@/store/slices/authSlice";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    dispatch(loginRequest(data));
  };

  return (
    <div className="flex w-full flex-col gap-3.5 sm:gap-6">
      <div className="space-y-0.5 sm:space-y-1.5 text-center">
        <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-on-surface">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-secondary">
          Enter your credentials to access your cinema log
        </p>
      </div>

      {error ? <AlertBanner message={error} variant="error" /> : null}

      <form className="flex flex-col gap-2.5 sm:gap-4.5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          error={
            errors.username ? (
              <span className="text-[11px] sm:text-xs text-status-error font-medium">
                {errors.username.message}
              </span>
            ) : null
          }
          id="username"
          label="Username"
        >
          <div className="relative">
            <Input
              {...register("username")}
              className="h-9 sm:h-10.5 border-outline-alt bg-surface-container/70 pl-8.5 sm:pl-9.5 pr-3 text-xs sm:text-sm focus-visible:bg-surface-container"
              id="username"
              placeholder="Your username"
              autoComplete="username"
              required
            />
            <User className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-outline-muted" />
          </div>
        </FormField>

        <FormField
          error={
            errors.password ? (
              <span className="text-[11px] sm:text-xs text-status-error font-medium">
                {errors.password.message}
              </span>
            ) : null
          }
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
              autoComplete="current-password"
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
              <span>Signing in...</span>
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-center text-xs sm:text-sm text-secondary">
        <span>Don&apos;t have an account?</span>
        <Link
          className="font-medium text-brand-primary hover:underline underline-offset-4"
          href="/signup"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
