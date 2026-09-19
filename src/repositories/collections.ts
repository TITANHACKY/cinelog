import { and, asc, desc, eq, sql } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  customCollectionFilters,
  customCollections,
  customCollectionSorts,
} from "@/db/schema";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/validations/collections";
import type { CustomCollectionWithFilters } from "@/lib/types";

function mapCollection(
  col: typeof customCollections.$inferSelect,
  filters: (typeof customCollectionFilters.$inferSelect)[],
  sorts: (typeof customCollectionSorts.$inferSelect)[],
): CustomCollectionWithFilters {
  return {
    id: col.id,
    userId: col.userId,
    name: col.name,
    mediaType: col.mediaType,
    showInDashboard: col.showInDashboard,
    showInLibrary: col.showInLibrary,
    groupBy: col.groupBy,
    displayOrder: col.displayOrder,
    createdAt: col.createdAt,
    updatedAt: col.updatedAt,
    filters: filters.map((f) => ({
      id: f.id,
      customCollectionId: f.customCollectionId,
      field: f.field,
      operator: f.operator,
      value: f.value,
    })),
    sorts: sorts.map((s) => ({
      id: s.id,
      customCollectionId: s.customCollectionId,
      field: s.field,
      direction: s.direction,
      priority: s.priority,
    })),
  };
}

export async function listUserCollections(
  userId: number,
): Promise<CustomCollectionWithFilters[]> {
  const db = getDb();
  const [collections, filters, sorts] = await db.batch([
    db
      .select()
      .from(customCollections)
      .where(eq(customCollections.userId, userId))
      .orderBy(
        asc(customCollections.displayOrder),
        desc(customCollections.createdAt),
      ),
    db
      .select({
        id: customCollectionFilters.id,
        customCollectionId: customCollectionFilters.customCollectionId,
        field: customCollectionFilters.field,
        operator: customCollectionFilters.operator,
        value: customCollectionFilters.value,
      })
      .from(customCollectionFilters)
      .innerJoin(
        customCollections,
        eq(customCollectionFilters.customCollectionId, customCollections.id),
      )
      .where(eq(customCollections.userId, userId)),
    db
      .select({
        id: customCollectionSorts.id,
        customCollectionId: customCollectionSorts.customCollectionId,
        field: customCollectionSorts.field,
        direction: customCollectionSorts.direction,
        priority: customCollectionSorts.priority,
      })
      .from(customCollectionSorts)
      .innerJoin(
        customCollections,
        eq(customCollectionSorts.customCollectionId, customCollections.id),
      )
      .where(eq(customCollections.userId, userId))
      .orderBy(asc(customCollectionSorts.priority)),
  ]);

  return collections.map((col) =>
    mapCollection(
      col,
      filters.filter((f) => f.customCollectionId === col.id),
      sorts.filter((s) => s.customCollectionId === col.id),
    ),
  );
}

export async function findUserCollectionById(
  id: number,
  userId: number,
): Promise<CustomCollectionWithFilters | null> {
  const db = getDb();
  const [collectionRows, filters, sorts] = await db.batch([
    db
      .select()
      .from(customCollections)
      .where(
        and(eq(customCollections.id, id), eq(customCollections.userId, userId)),
      ),
    db
      .select()
      .from(customCollectionFilters)
      .where(eq(customCollectionFilters.customCollectionId, id)),
    db
      .select()
      .from(customCollectionSorts)
      .where(eq(customCollectionSorts.customCollectionId, id))
      .orderBy(asc(customCollectionSorts.priority)),
  ]);

  const collection = collectionRows[0];
  if (!collection) return null;

  return mapCollection(collection, filters, sorts);
}

export async function insertUserCollection(
  userId: number,
  data: CreateCollectionInput,
): Promise<CustomCollectionWithFilters> {
  const db = getDb();
  const collectionIdSql = sql`(select max(${customCollections.id}) from ${customCollections} where ${customCollections.userId} = ${userId})`;

  const queries: SqliteBatchQuery[] = [
    db
      .insert(customCollections)
      .values({
        userId,
        name: data.name,
        mediaType: data.mediaType,
        showInDashboard: data.showInDashboard,
        showInLibrary: data.showInLibrary,
        groupBy: data.groupBy ?? null,
        displayOrder: data.displayOrder,
      })
      .returning(),
  ];

  if (data.filters.length > 0) {
    queries.push(
      db
        .insert(customCollectionFilters)
        .values(
          data.filters.map((filter) => ({
            customCollectionId: collectionIdSql,
            field: filter.field,
            operator: filter.operator,
            value: filter.value,
          })),
        )
        .returning(),
    );
  }

  if (data.sorts && data.sorts.length > 0) {
    queries.push(
      db
        .insert(customCollectionSorts)
        .values(
          data.sorts.map((sort, i) => ({
            customCollectionId: collectionIdSql,
            field: sort.field,
            direction: sort.direction,
            priority: sort.priority ?? i,
          })),
        )
        .returning(),
    );
  }

  const results = await db.batch(asBatch(queries));
  let resultIndex = 0;
  const createdCollections = results[resultIndex++] as (
    typeof customCollections.$inferSelect
  )[];
  let createdFilters: (typeof customCollectionFilters.$inferSelect)[] = [];
  if (data.filters.length > 0) {
    createdFilters = results[resultIndex++] as (
      typeof customCollectionFilters.$inferSelect
    )[];
  }
  let createdSorts: (typeof customCollectionSorts.$inferSelect)[] = [];
  if (data.sorts && data.sorts.length > 0) {
    createdSorts = results[resultIndex++] as (
      typeof customCollectionSorts.$inferSelect
    )[];
  }

  return mapCollection(
    createdCollections[0],
    createdFilters,
    createdSorts,
  );
}

export async function updateUserCollection(
  id: number,
  userId: number,
  data: UpdateCollectionInput,
): Promise<CustomCollectionWithFilters | null> {
  const db = getDb();
  const existing = await findUserCollectionById(id, userId);
  if (!existing) return null;

  const updates: Partial<typeof customCollections.$inferInsert> = {
    updatedAt: String(Math.floor(Date.now() / 1000)),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.mediaType !== undefined) updates.mediaType = data.mediaType;
  if (data.showInDashboard !== undefined)
    updates.showInDashboard = data.showInDashboard;
  if (data.showInLibrary !== undefined)
    updates.showInLibrary = data.showInLibrary;
  if (data.groupBy !== undefined) updates.groupBy = data.groupBy;
  if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;

  const queries: SqliteBatchQuery[] = [
    db
      .update(customCollections)
      .set(updates)
      .where(
        and(eq(customCollections.id, id), eq(customCollections.userId, userId)),
      )
      .returning(),
  ];

  if (data.filters !== undefined) {
    queries.push(
      db
        .delete(customCollectionFilters)
        .where(eq(customCollectionFilters.customCollectionId, id)),
    );

    if (data.filters.length > 0) {
      queries.push(
        db
          .insert(customCollectionFilters)
          .values(
            data.filters.map((filter) => ({
              customCollectionId: id,
              field: filter.field,
              operator: filter.operator,
              value: filter.value,
            })),
          )
          .returning(),
      );
    }
  }

  if (data.sorts !== undefined) {
    queries.push(
      db
        .delete(customCollectionSorts)
        .where(eq(customCollectionSorts.customCollectionId, id)),
    );

    if (data.sorts.length > 0) {
      queries.push(
        db
          .insert(customCollectionSorts)
          .values(
            data.sorts.map((sort, i) => ({
              customCollectionId: id,
              field: sort.field,
              direction: sort.direction,
              priority: sort.priority ?? i,
            })),
          )
          .returning(),
      );
    }
  }

  const results = await db.batch(asBatch(queries));
  const updated = (results[0] as (typeof customCollections.$inferSelect)[])[0];

  let finalFilters = existing.filters;
  let finalSorts = existing.sorts ?? [];
  let resultIndex = 1;

  if (data.filters !== undefined) {
    resultIndex += 1;
    if (data.filters.length > 0) {
      finalFilters = (
        results[resultIndex] as (typeof customCollectionFilters.$inferSelect)[]
      ).map((created) => ({
        id: created.id,
        customCollectionId: created.customCollectionId,
        field: created.field,
        operator: created.operator,
        value: created.value,
      }));
      resultIndex += 1;
    } else {
      finalFilters = [];
    }
  }

  if (data.sorts !== undefined) {
    resultIndex += 1;
    if (data.sorts.length > 0) {
      finalSorts = (
        results[resultIndex] as (typeof customCollectionSorts.$inferSelect)[]
      ).map((created) => ({
        id: created.id,
        customCollectionId: created.customCollectionId,
        field: created.field,
        direction: created.direction,
        priority: created.priority,
      }));
    } else {
      finalSorts = [];
    }
  }

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    mediaType: updated.mediaType,
    showInDashboard: updated.showInDashboard,
    showInLibrary: updated.showInLibrary,
    groupBy: updated.groupBy,
    displayOrder: updated.displayOrder,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    filters: finalFilters,
    sorts: finalSorts,
  };
}

export async function deleteUserCollection(
  id: number,
  userId: number,
): Promise<boolean> {
  const db = getDb();
  const existing = await findUserCollectionById(id, userId);
  if (!existing) return false;

  await db.batch(
    asBatch([
      db
        .delete(customCollectionFilters)
        .where(eq(customCollectionFilters.customCollectionId, id)),
      db
        .delete(customCollectionSorts)
        .where(eq(customCollectionSorts.customCollectionId, id)),
      db
        .delete(customCollections)
        .where(
          and(eq(customCollections.id, id), eq(customCollections.userId, userId)),
        ),
    ]),
  );

  const remaining = await db
    .select({ id: customCollections.id })
    .from(customCollections)
    .where(eq(customCollections.userId, userId))
    .orderBy(
      asc(customCollections.displayOrder),
      desc(customCollections.createdAt),
    );

  if (remaining.length > 0) {
    await db.batch(
      asBatch(
        remaining.map((row, index) =>
          db
            .update(customCollections)
            .set({
              displayOrder: index,
              updatedAt: String(Math.floor(Date.now() / 1000)),
            })
            .where(eq(customCollections.id, row.id)),
        ),
      ),
    );
  }

  return true;
}

export async function reorderUserCollections(
  userId: number,
  orderedIds: number[],
): Promise<CustomCollectionWithFilters[]> {
  const db = getDb();
  const existing = await listUserCollections(userId);
  const existingIds = new Set(existing.map((col) => col.id));

  if (
    orderedIds.length !== existing.length ||
    orderedIds.some((id) => !existingIds.has(id))
  ) {
    throw new Error("Invalid collection order");
  }

  await db.batch(
    asBatch(
      orderedIds.map((id, index) =>
        db
          .update(customCollections)
          .set({
            displayOrder: index,
            updatedAt: String(Math.floor(Date.now() / 1000)),
          })
          .where(
            and(
              eq(customCollections.id, id),
              eq(customCollections.userId, userId),
            ),
          ),
      ),
    ),
  );

  return listUserCollections(userId);
}

export async function nextDisplayOrder(userId: number) {
  const db = getDb();
  const rows = await db
    .select({ value: customCollections.displayOrder })
    .from(customCollections)
    .where(eq(customCollections.userId, userId))
    .orderBy(desc(customCollections.displayOrder))
    .limit(1);

  return Number(rows[0]?.value ?? -1) + 1;
}
