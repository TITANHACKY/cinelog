import { z } from "zod";
import {
  IMPRESSION,
  LIBRARY_OPERATORS_BY_FIELD,
  LIBRARY_PAGE_SIZE,
  LIBRARY_PAGE_SIZE_MAX,
  SMART_COLLECTIONS,
  WATCH_STATUS,
} from "@/lib/constants";

const watchStatusValues: number[] = Object.values(WATCH_STATUS).map(
  (status) => status.value,
);
const impressionValues: number[] = Object.values(IMPRESSION).map(
  (impression) => impression.value,
);

export const moviePatchSchema = z
  .object({
    watch_status: z
      .number()
      .refine((value) => watchStatusValues.includes(value), {
        message: "Invalid watch_status",
      })
      .optional(),
    impression: z
      .union([
        z.null(),
        z.number().refine((value) => impressionValues.includes(value), {
          message: "Invalid impression",
        }),
      ])
      .optional(),
  })
  .refine(
    (data) =>
      data.watch_status !== undefined || data.impression !== undefined,
    { message: "No valid fields to update" },
  );

export const seriesPatchSchema = z
  .object({
    watch_status: z
      .number()
      .refine((value) => watchStatusValues.includes(value), {
        message: "Invalid watch_status",
      })
      .optional(),
    impression: z
      .union([
        z.null(),
        z.number().refine((value) => impressionValues.includes(value), {
          message: "Invalid impression",
        }),
      ])
      .optional(),
    mark_season_to_watched: z.number().int().nonnegative().optional(),
    mark_episode_to_watched: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, context) => {
    const hasSeason = data.mark_season_to_watched !== undefined;
    const hasEpisode = data.mark_episode_to_watched !== undefined;

    if (hasSeason !== hasEpisode) {
      context.addIssue({
        code: "custom",
        message:
          "mark_season_to_watched and mark_episode_to_watched must be provided together",
      });
    }

    if (
      data.watch_status === undefined &&
      data.impression === undefined &&
      !hasSeason &&
      !hasEpisode
    ) {
      context.addIssue({
        code: "custom",
        message: "No valid fields to update",
      });
    }
  });

function parsePageInt(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return Number(value);
}

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}

const filterFields = Object.keys(SMART_COLLECTIONS.filter_field) as [
  keyof typeof SMART_COLLECTIONS.filter_field,
  ...(keyof typeof SMART_COLLECTIONS.filter_field)[],
];
const sortFields = Object.keys(SMART_COLLECTIONS.sort_field) as [
  keyof typeof SMART_COLLECTIONS.sort_field,
  ...(keyof typeof SMART_COLLECTIONS.sort_field)[],
];

export const libraryQuerySchema = z
  .object({
    type: z.enum(["movie", "series"]),
    offset: z.preprocess(
      (value) => parsePageInt(value, 0),
      z.number().int().min(0),
    ),
    limit: z.preprocess(
      (value) => parsePageInt(value, LIBRARY_PAGE_SIZE),
      z.number().int().min(1).max(LIBRARY_PAGE_SIZE_MAX),
    ),
    q: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).max(100).optional(),
    ),
    filter_field: z.preprocess(emptyToUndefined, z.enum(filterFields).optional()),
    filter_operator: z.preprocess(
      (value) => {
        const next = emptyToUndefined(value);
        return next === undefined ? undefined : Number(next);
      },
      z.number().int().min(0).max(4).optional(),
    ),
    filter_value: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).max(1000).optional(),
    ),
    sort_field: z.preprocess(
      (value) => emptyToUndefined(value) ?? "created_at",
      z.enum(sortFields),
    ),
    sort_direction: z.preprocess(
      (value) => (emptyToUndefined(value) === undefined ? 1 : Number(value)),
      z.union([z.literal(0), z.literal(1)]),
    ),
    group_by: z.preprocess(
      (value) => {
        const next = emptyToUndefined(value);
        return next === undefined ? undefined : Number(next);
      },
      z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
    ),
    group_key: z.preprocess(emptyToUndefined, z.string().min(1).max(64).optional()),
  })
  .superRefine((data, context) => {
    const hasFilterPart =
      data.filter_field !== undefined ||
      data.filter_operator !== undefined ||
      data.filter_value !== undefined;
    const hasFullFilter =
      data.filter_field !== undefined &&
      data.filter_operator !== undefined &&
      data.filter_value !== undefined;

    if (data.group_key && data.group_by === undefined) {
      context.addIssue({
        code: "custom",
        message: "Validation failed",
      });
    }

    if (hasFilterPart && !hasFullFilter) {
      context.addIssue({
        code: "custom",
        message: "Validation failed",
      });
      return;
    }

    if (
      hasFullFilter &&
      data.filter_field &&
      data.filter_operator !== undefined &&
      !LIBRARY_OPERATORS_BY_FIELD[data.filter_field].includes(
        data.filter_operator as 0 | 1 | 2 | 3 | 4,
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Validation failed",
      });
    }
  });

export type MoviePatchInput = z.infer<typeof moviePatchSchema>;
export type SeriesPatchInput = z.infer<typeof seriesPatchSchema>;
export type LibraryQuerySchemaInput = z.infer<typeof libraryQuerySchema>;

export type LibraryFilterClause = {
  field: NonNullable<LibraryQuerySchemaInput["filter_field"]>;
  operator: NonNullable<LibraryQuerySchemaInput["filter_operator"]>;
  value: string;
};

export type LibraryQueryInput = LibraryQuerySchemaInput & {
  filters?: LibraryFilterClause[];
};
