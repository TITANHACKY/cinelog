import { z } from "zod";

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(6, "Password must be at least 6 characters")
  .max(20, "Password cannot exceed 20 characters")
  .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
  .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
  .regex(/[0-9]/, "Must contain at least 1 number")
  .regex(/[@#&!_]/, "Must contain at least 1 symbol (@, #, &, !, _)")
  .regex(
    /^[a-zA-Z0-9@#&!_]+$/,
    "Only alphanumeric and @, #, &, ! symbols are allowed",
  );

export const signupSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(10, "Username cannot exceed 10 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: passwordSchema,
  displayName: z.string().optional(),
});

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(10, "Username cannot exceed 10 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  password: z.string(),
});

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(10, "Username cannot exceed 10 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .optional(),
    email: z.string().trim().email("Invalid email format").optional(),
    displayName: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
      }),
    currentPassword: z.string().optional(),
    newPassword: passwordSchema.optional(),
  })
  .superRefine((data, context) => {
    if (data.newPassword && !data.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Current password is required to set a new password",
      });
    }

    if (
      data.username === undefined &&
      data.email === undefined &&
      data.displayName === undefined &&
      data.newPassword === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "No valid fields to update",
      });
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
