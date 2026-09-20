import { AppError } from "@/lib/http/errors";
import { findUserById } from "@/repositories/users";
import {
  loadUserPreferences,
  markOnboardingCompleted,
  replaceUserPreferences,
} from "@/repositories/preferences";
import type { UserPreferences, UserPreferencesInput } from "@/lib/types";

export async function getUserPreferences(
  userId: number,
): Promise<UserPreferences | null> {
  return loadUserPreferences(userId);
}

export async function saveUserPreferences(
  userId: number,
  input: UserPreferencesInput,
): Promise<{ tokenReissueNeeded: boolean }> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await replaceUserPreferences(userId, input);

  const alreadyCompleted = user.onboardingCompletedAt != null;
  if (!alreadyCompleted) {
    await markOnboardingCompleted(userId, String(Math.floor(Date.now() / 1000)));
  }

  return { tokenReissueNeeded: !alreadyCompleted };
}
