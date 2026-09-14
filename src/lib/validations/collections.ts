import { z } from "zod";

export const collectionFilterInputSchema = z.object({
  id: z.number().optional(),
  field: z.enum([
    "release_year",
    "certification",
    "original_language",
    "origin_country",
    "genre",
  ]),
  operator: z.number().int().min(0).max(4),
  value: z.string().min(1, "Filter value is required"),
});

export const collectionSortInputSchema = z.object({
  id: z.number().optional(),
  field: z.string().min(1),
  direction: z.number().int().min(0).max(1),
  priority: z.number().int().default(0),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100),
  mediaType: z.number().int().refine((val) => val === 0 || val === 1, {
    message: "Media type must be 0 (Movie) or 1 (Series)",
  }),
  showInDashboard: z.boolean().default(false),
  showInLibrary: z.boolean().default(true),
  groupBy: z.number().int().nullable().optional(),
  displayOrder: z.number().int().default(0),
  filters: z
    .array(collectionFilterInputSchema)
    .min(1, "At least one filter is required"),
  sorts: z.array(collectionSortInputSchema).optional().default([]),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100).optional(),
  mediaType: z
    .number()
    .int()
    .refine((val) => val === 0 || val === 1, {
      message: "Media type must be 0 (Movie) or 1 (Series)",
    })
    .optional(),
  showInDashboard: z.boolean().optional(),
  showInLibrary: z.boolean().optional(),
  groupBy: z.number().int().nullable().optional(),
  displayOrder: z.number().int().optional(),
  filters: z
    .array(collectionFilterInputSchema)
    .min(1, "At least one filter is required")
    .optional(),
  sorts: z.array(collectionSortInputSchema).optional(),
});

export type CollectionFilterInput = z.infer<typeof collectionFilterInputSchema>;
export type CollectionSortInput = z.infer<typeof collectionSortInputSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

