import { z } from "zod";
import {
  ERA_VALUES,
  GENRE_MAX,
  LANGUAGE_CODES,
  LANGUAGE_MAX,
  MIN_RATING_VALUES,
  SEED_TITLE_MAX,
} from "@/lib/constants";

const seedTitleSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.union([z.literal(0), z.literal(1)]),
  title: z.string().min(1).max(300),
  posterPath: z.string().max(500).nullable(),
});

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
  languages: z.array(z.enum(LANGUAGE_CODES as [string, ...string[]])).max(LANGUAGE_MAX),
  seedTitles: z.array(seedTitleSchema).max(SEED_TITLE_MAX),
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
});
