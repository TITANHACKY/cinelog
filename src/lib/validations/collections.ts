import { z } from "zod";
import { CUSTOM_COLLECTIONS, MAX_COLLECTION_FILTERS } from "@/lib/constants/api";

const filterFields = Object.keys(CUSTOM_COLLECTIONS.filter_field) as [
  keyof typeof CUSTOM_COLLECTIONS.filter_field,
  ...(keyof typeof CUSTOM_COLLECTIONS.filter_field)[],
];
const sortFields = Object.keys(CUSTOM_COLLECTIONS.sort_field) as [
  keyof typeof CUSTOM_COLLECTIONS.sort_field,
  ...(keyof typeof CUSTOM_COLLECTIONS.sort_field)[],
];

export const collectionFilterInputSchema = z.object({
  id: z.number().optional(),
  field: z.enum(filterFields),
  operator: z.number().int().min(0).max(4),
  value: z.string().min(1, "Filter value is required"),
});

export const collectionSortInputSchema = z.object({
  id: z.number().optional(),
  field: z.enum(sortFields),
  direction: z.union([z.literal(0), z.literal(1)]),
  priority: z.number().int().default(0),
});

function applyCollectionRules(
  data: {
    showInDashboard?: boolean;
    showInLibrary?: boolean;
    groupBy?: number | null;
  },
  context: z.RefinementCtx,
) {
  const showInDashboard = data.showInDashboard ?? false;
  const showInLibrary = data.showInLibrary ?? false;
  const groupBy = data.groupBy ?? null;

  if (showInDashboard && groupBy !== null) {
    context.addIssue({
      code: "custom",
      message: "Dashboard collections cannot use grouping",
      path: ["groupBy"],
    });
  }

  if (groupBy !== null && (!showInLibrary || showInDashboard)) {
    context.addIssue({
      code: "custom",
      message: "Grouping requires show in library and no dashboard display",
      path: ["groupBy"],
    });
  }
}

export const createCollectionSchema = z
  .object({
    name: z.string().min(1, "Collection name is required").max(100),
    mediaType: z.number().int().refine((val) => val === 0 || val === 1, {
      message: "Media type must be 0 (Movie) or 1 (Series)",
    }),
    showInDashboard: z.boolean().default(false),
    showInLibrary: z.boolean().default(true),
    groupBy: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .nullable()
      .optional(),
    displayOrder: z.number().int().default(0),
    filters: z
      .array(collectionFilterInputSchema)
      .max(
        MAX_COLLECTION_FILTERS,
        `At most ${MAX_COLLECTION_FILTERS} filters are allowed`,
      )
      .default([]),
    sorts: z
      .array(collectionSortInputSchema)
      .max(1, "Only one sort is allowed")
      .optional()
      .default([]),
  })
  .superRefine(applyCollectionRules);

export const updateCollectionSchema = z
  .object({
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
    groupBy: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .nullable()
      .optional(),
    displayOrder: z.number().int().optional(),
    filters: z
      .array(collectionFilterInputSchema)
      .max(
        MAX_COLLECTION_FILTERS,
        `At most ${MAX_COLLECTION_FILTERS} filters are allowed`,
      )
      .optional(),
    sorts: z.array(collectionSortInputSchema).max(1).optional(),
  })
  .superRefine((data, context) => {
    if (
      data.showInDashboard !== undefined ||
      data.showInLibrary !== undefined ||
      data.groupBy !== undefined
    ) {
      applyCollectionRules(data, context);
    }
  });

export const reorderCollectionsSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

export const collectionItemsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  q: z.string().trim().max(100).optional(),
  group_key: z.string().min(1).max(64).optional(),
});

export type CollectionFilterInput = z.infer<typeof collectionFilterInputSchema>;
export type CollectionSortInput = z.infer<typeof collectionSortInputSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type ReorderCollectionsInput = z.infer<typeof reorderCollectionsSchema>;
export type CollectionItemsQueryInput = z.infer<
  typeof collectionItemsQuerySchema
>;
