"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@/store/slices/authSlice";
import { apiErrorMessage } from "@/store/api/base-api";
import { useUpdateProfileMutation } from "@/store/api/user-api";
import { updateProfileSchema } from "@/lib/validations/auth";

function profileErrorMessage(data: { error?: string; details?: unknown }) {
  if (Array.isArray(data.details)) {
    const first = data.details[0];
    if (
      first &&
      typeof first === "object" &&
      "message" in first &&
      typeof first.message === "string" &&
      first.message.trim()
    ) {
      return first.message;
    }
  }

  return data.error || "Failed to update profile.";
}

export function useProfileForm(user: User | null) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      setErrorMessage("You must be signed in to update your profile.");
      return;
    }

    if (confirmPassword && !newPassword) {
      setErrorMessage("Enter a new password or clear the confirmation field.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    const payload: Record<string, unknown> = {};
    if (username.trim() !== user.username) payload.username = username.trim();
    if (email.trim() !== user.email) payload.email = email.trim();
    if (displayName.trim() !== (user.displayName || "").trim()) {
      payload.displayName = displayName.trim() || null;
    }
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const parsed = updateProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    try {
      await updateProfile(parsed.data).unwrap();
      setSuccessMessage("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const apiError =
        error && typeof error === "object"
          ? (error as { message?: string; details?: unknown })
          : undefined;
      setErrorMessage(
        profileErrorMessage({
          error: apiError?.message,
          details: apiError?.details,
        }) ||
          apiErrorMessage(error, "A network error occurred. Please try again."),
      );
    }
  }

  return {
    username,
    setUsername,
    email,
    setEmail,
    displayName,
    setDisplayName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    successMessage,
    errorMessage,
    handleSubmit,
  };
}
