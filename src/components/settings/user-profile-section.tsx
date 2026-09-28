"use client";

import { KeyRound, Loader2, User as UserIcon } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useProfileForm } from "@/hooks/settings/use-profile-form";
import { useAppSelector } from "@/store";
import type { User } from "@/store/slices/authSlice";

export function UserProfileSection() {
  const { user } = useAppSelector((state) => state.auth);

  return <UserProfileForm key={user?.id ?? "guest"} user={user} />;
}

function UserProfileForm({ user }: { user: User | null }) {
  const form = useProfileForm(user);

  return (
    <section
      aria-labelledby="profile-settings-heading"
      className="w-full space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary-container/20 text-brand-primary">
          <UserIcon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h2
            className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl"
            id="profile-settings-heading"
          >
            User Profile
          </h2>
          <p className="font-public-sans text-xs text-secondary">
            Update your account identity, email address, and authentication
            passkeys.
          </p>
        </div>
      </div>

      {form.successMessage ? (
        <AlertBanner message={form.successMessage} variant="success" />
      ) : null}
      {form.errorMessage ? (
        <AlertBanner message={form.errorMessage} variant="error" />
      ) : null}

      <form className="space-y-6" onSubmit={form.handleSubmit}>
        <div className="rounded-xl border border-outline-alt bg-surface-container-low p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              hint="Alphanumeric characters and underscores only."
              id="username-input"
              label="Username"
            >
              <Input
                className="border-outline-alt text-on-surface"
                disabled={!user || form.isLoading}
                id="username-input"
                maxLength={10}
                minLength={3}
                onChange={(event) => form.setUsername(event.target.value)}
                pattern="[A-Za-z0-9_]+"
                placeholder="Username (3-10 characters)"
                required
                type="text"
                value={form.username}
              />
            </FormField>
            <FormField
              hint="Used for account identification and notifications."
              id="email-input"
              label="Email Address"
            >
              <Input
                className="border-outline-alt text-on-surface"
                disabled={!user || form.isLoading}
                id="email-input"
                onChange={(event) => form.setEmail(event.target.value)}
                placeholder="name@example.com"
                required
                type="email"
                value={form.email}
              />
            </FormField>
            <FormField
              className="sm:col-span-2"
              id="display-name-input"
              label="Display Name (Optional)"
            >
              <Input
                className="border-outline-alt text-on-surface"
                disabled={!user || form.isLoading}
                id="display-name-input"
                onChange={(event) => form.setDisplayName(event.target.value)}
                placeholder="Your Public Name"
                type="text"
                value={form.displayName}
              />
            </FormField>
          </div>
        </div>

        <div className="rounded-xl border border-outline-alt bg-surface-container-low p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-secondary">
            <KeyRound className="h-4 w-4 shrink-0 text-brand-primary" />
            <h3 className="font-heading text-sm font-semibold text-on-surface">
              Change Password
            </h3>
            <span className="font-public-sans text-[11px] text-outline-muted">
              Leave blank to keep your current password. New passwords need 6–20
              characters, upper and lower case, a number, and one of @ # & ! _
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FormField id="current-password-input" label="Current Password">
              <Input
                autoComplete="current-password"
                className="border-outline-alt text-on-surface"
                disabled={!user || form.isLoading}
                id="current-password-input"
                onChange={(event) =>
                  form.setCurrentPassword(event.target.value)
                }
                placeholder="••••••••"
                type="password"
                value={form.currentPassword}
              />
            </FormField>
            <FormField id="new-password-input" label="New Password">
              <Input
                autoComplete="new-password"
                className="border-outline-alt text-on-surface"
                disabled={!user || form.isLoading}
                id="new-password-input"
                onChange={(event) => form.setNewPassword(event.target.value)}
                placeholder="••••••••"
                type="password"
                value={form.newPassword}
              />
            </FormField>
            <FormField id="confirm-password-input" label="Confirm New Password">
              <Input
                autoComplete="new-password"
                className="border-outline-alt text-on-surface"
                disabled={!user || form.isLoading}
                id="confirm-password-input"
                onChange={(event) =>
                  form.setConfirmPassword(event.target.value)
                }
                placeholder="••••••••"
                type="password"
                value={form.confirmPassword}
              />
            </FormField>
          </div>
        </div>

        <div>
          <Button
            variant="primaryFilled"
            disabled={!user || form.isLoading}
            type="submit"
          >
            {form.isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
