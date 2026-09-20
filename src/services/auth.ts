import { compare, hash } from "bcryptjs";
import { AppError } from "@/lib/http/errors";
import { createSessionToken } from "@/lib/auth/session";
import type {
  LoginInput,
  SignupInput,
  UpdateProfileInput,
} from "@/lib/validations/auth";
import {
  findUserAndNameConflicts,
  findUserById,
  findUserByUsername,
  findUserByUsernameOrEmail,
  insertUser,
  updateUser,
} from "@/repositories/users";

function toPublicUser(user: {
  id: number;
  username: string;
  email?: string;
  displayName: string | null;
  onboardingCompletedAt?: string | null;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    hasCompletedOnboarding: user.onboardingCompletedAt != null,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByUsername(input.username);

  if (!user) {
    throw new AppError("Invalid username or password", 401);
  }

  const isPasswordValid = await compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid username or password", 401);
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    onboarding: user.onboardingCompletedAt != null ? "completed" : undefined,
  });

  return { token, publicUser: toPublicUser(user) };
}

export async function signupUser(input: SignupInput) {
  const existingUser = await findUserByUsernameOrEmail(
    input.username,
    input.email,
  );

  if (existingUser) {
    throw new AppError("Username or email already in use", 409);
  }

  const passwordHash = await hash(input.password, 10);
  const newUser = await insertUser({
    username: input.username,
    email: input.email,
    passwordHash,
    displayName: input.displayName || null,
  });

  const token = await createSessionToken({
    userId: newUser.id,
    username: newUser.username,
  });

  return { token, publicUser: toPublicUser(newUser) };
}

export async function getCurrentUser(userId: number) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
}

export async function updateUserProfile(
  userId: number,
  input: UpdateProfileInput,
) {
  const { user, usernameOwner, emailOwner } = await findUserAndNameConflicts(
    userId,
    input.username,
    input.email,
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updates: Partial<typeof user> = {
    updatedAt: String(Math.floor(Date.now() / 1000)),
  };

  if (input.username && input.username !== user.username) {
    if (usernameOwner && usernameOwner.id !== userId) {
      throw new AppError("Username already in use", 409);
    }
    updates.username = input.username;
  }

  if (input.email && input.email !== user.email) {
    if (emailOwner && emailOwner.id !== userId) {
      throw new AppError("Email already in use", 409);
    }
    updates.email = input.email;
  }

  if (input.displayName !== undefined) {
    updates.displayName = input.displayName;
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new AppError(
        "Current password is required to set a new password",
        400,
      );
    }
    const isCurrentValid = await compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new AppError("Current password is incorrect", 400);
    }
    updates.passwordHash = await hash(input.newPassword, 10);
  }

  const updatedUser = await updateUser(userId, updates);
  if (!updatedUser) {
    throw new AppError("Failed to update user", 500);
  }

  let token: string | undefined;
  if (updates.username) {
    token = await createSessionToken({
      userId: updatedUser.id,
      username: updatedUser.username,
    });
  }

  return { token, publicUser: toPublicUser(updatedUser) };
}
