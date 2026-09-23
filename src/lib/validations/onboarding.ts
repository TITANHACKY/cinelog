import { z } from "zod";
import {
  ERA_VALUES,
  GENRE_MAX,
  LANGUAGE_CODES,
  LANGUAGE_MAX,
  MIN_RATING_VALUES,
} from "@/lib/constants";

export const preferencesSchema = z.object({
  mediaLean: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  minRating: z
    .union([
      z.literal(MIN_RATING_VALUES[0]),
      z.literal(MIN_RATING_VALUES[1]),
      z.literal(MIN_RATING_VALUES[2]),
    ])
    .nullable(),
  eras: z.array(z.enum(ERA_VALUES as [string, ...string[]])).max(ERA_VALUES.length),
  genreIds: z.array(z.number().int().positive()).min(1).max(GENRE_MAX),
  languages: z
    .array(z.enum(LANGUAGE_CODES as [string, ...string[]]))
    .min(1)
    .max(LANGUAGE_MAX),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

export const titleSuggestionsQuerySchema = z.object({
  genres: z
    .string()
    .optional()
    .transform((raw) =>
      (raw ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  mediaType: z
    .enum(["0", "1", "2"])
    .optional()
    .transform((value) => (value === undefined ? 2 : (Number(value) as 0 | 1 | 2))),
  languages: z
    .string()
    .optional()
    .transform((raw) =>
      Array.from(
        new Set(
          (raw ?? "")
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter((value) => /^[a-z]{2}$/.test(value)),
        ),
      ),
    ),
  minRating: z
    .string()
    .optional()
    .transform((raw) => {
      const value = Number(raw);
      return raw && Number.isFinite(value) && value >= 0 && value <= 10
        ? value
        : null;
    }),
  eras: z
    .string()
    .optional()
    .transform((raw) =>
      (raw ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => (ERA_VALUES as string[]).includes(value)),
    ),
});
