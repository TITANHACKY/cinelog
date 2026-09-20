import { and, asc, desc, eq, sql } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  smartCollectionFilters,
  smartCollections,
  smartCollectionSorts,
} from "@/db/schema";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/validations/collections";
import type { SmartCollectionWithFilters } from "@/lib/types";

function mapCollection(
  col: typeof smartCollections.$inferSelect,
  filters: (typeof smartCollectionFilters.$inferSelect)[],
  sorts: (typeof smartCollectionSorts.$inferSelect)[],
): SmartCollectionWithFilters {
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
      smartCollectionId: f.smartCollectionId,
      field: f.field,
      operator: f.operator,
      value: f.value,
    })),
    sorts: sorts.map((s) => ({
      id: s.id,
      smartCollectionId: s.smartCollectionId,
      field: s.field,
      direction: s.direction,
      priority: s.priority,
    })),
  };
}

export async function listUserCollections(
  userId: number,
): Promise<SmartCollectionWithFilters[]> {
  const db = getDb();
  const [collections, filters, sorts] = await db.batch([
    db
      .select()
      .from(smartCollections)
      .where(eq(smartCollections.userId, userId))
      .orderBy(
        asc(smartCollections.displayOrder),
        desc(smartCollections.createdAt),
      ),
    db
      .select({
        id: smartCollectionFilters.id,
        smartCollectionId: smartCollectionFilters.smartCollectionId,
        field: smartCollectionFilters.field,
        operator: smartCollectionFilters.operator,
        value: smartCollectionFilters.value,
      })
      .from(smartCollectionFilters)
      .innerJoin(
        smartCollections,
        eq(smartCollectionFilters.smartCollectionId, smartCollections.id),
      )
      .where(eq(smartCollections.userId, userId)),
    db
      .select({
        id: smartCollectionSorts.id,
        smartCollectionId: smartCollectionSorts.smartCollectionId,
        field: smartCollectionSorts.field,
        direction: smartCollectionSorts.direction,
        priority: smartCollectionSorts.priority,
      })
      .from(smartCollectionSorts)
      .innerJoin(
        smartCollections,
        eq(smartCollectionSorts.smartCollectionId, smartCollections.id),
      )
      .where(eq(smartCollections.userId, userId))
      .orderBy(asc(smartCollectionSorts.priority)),
  ]);

  return collections.map((col) =>
    mapCollection(
      col,
      filters.filter((f) => f.smartCollectionId === col.id),
      sorts.filter((s) => s.smartCollectionId === col.id),
    ),
  );
}

export async function findUserCollectionById(
  id: number,
  userId: number,
): Promise<SmartCollectionWithFilters | null> {
  const db = getDb();
  const [collectionRows, filters, sorts] = await db.batch([
    db
      .select()
      .from(smartCollections)
      .where(
        and(eq(smartCollections.id, id), eq(smartCollections.userId, userId)),
      ),
    db
      .select()
      .from(smartCollectionFilters)
      .where(eq(smartCollectionFilters.smartCollectionId, id)),
    db
      .select()
      .from(smartCollectionSorts)
      .where(eq(smartCollectionSorts.smartCollectionId, id))
      .orderBy(asc(smartCollectionSorts.priority)),
  ]);

  const collection = collectionRows[0];
  if (!collection) return null;

  return mapCollection(collection, filters, sorts);
}

export async function insertUserCollection(
  userId: number,
  data: CreateCollectionInput,
): Promise<SmartCollectionWithFilters> {
  const db = getDb();
  const collectionIdSql = sql`(select max(${smartCollections.id}) from ${smartCollections} where ${smartCollections.userId} = ${userId})`;

  const queries: SqliteBatchQuery[] = [
    db
      .insert(smartCollections)
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
        .insert(smartCollectionFilters)
        .values(
          data.filters.map((filter) => ({
            smartCollectionId: collectionIdSql,
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
        .insert(smartCollectionSorts)
        .values(
          data.sorts.map((sort, i) => ({
            smartCollectionId: collectionIdSql,
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
    typeof smartCollections.$inferSelect
  )[];
  let createdFilters: (typeof smartCollectionFilters.$inferSelect)[] = [];
  if (data.filters.length > 0) {
    createdFilters = results[resultIndex++] as (
      typeof smartCollectionFilters.$inferSelect
    )[];
  }
  let createdSorts: (typeof smartCollectionSorts.$inferSelect)[] = [];
  if (data.sorts && data.sorts.length > 0) {
    createdSorts = results[resultIndex++] as (
      typeof smartCollectionSorts.$inferSelect
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
): Promise<SmartCollectionWithFilters | null> {
  const db = getDb();
  const existing = await findUserCollectionById(id, userId);
  if (!existing) return null;

  const updates: Partial<typeof smartCollections.$inferInsert> = {
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
      .update(smartCollections)
      .set(updates)
      .where(
        and(eq(smartCollections.id, id), eq(smartCollections.userId, userId)),
      )
      .returning(),
  ];

  if (data.filters !== undefined) {
    queries.push(
      db
        .delete(smartCollectionFilters)
        .where(eq(smartCollectionFilters.smartCollectionId, id)),
    );

    if (data.filters.length > 0) {
      queries.push(
        db
          .insert(smartCollectionFilters)
          .values(
            data.filters.map((filter) => ({
              smartCollectionId: id,
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
        .delete(smartCollectionSorts)
        .where(eq(smartCollectionSorts.smartCollectionId, id)),
    );

    if (data.sorts.length > 0) {
      queries.push(
        db
          .insert(smartCollectionSorts)
          .values(
            data.sorts.map((sort, i) => ({
              smartCollectionId: id,
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
  const updated = (results[0] as (typeof smartCollections.$inferSelect)[])[0];

  let finalFilters = existing.filters;
  let finalSorts = existing.sorts ?? [];
  let resultIndex = 1;

  if (data.filters !== undefined) {
    resultIndex += 1;
    if (data.filters.length > 0) {
      finalFilters = (
        results[resultIndex] as (typeof smartCollectionFilters.$inferSelect)[]
      ).map((created) => ({
        id: created.id,
        smartCollectionId: created.smartCollectionId,
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
        results[resultIndex] as (typeof smartCollectionSorts.$inferSelect)[]
      ).map((created) => ({
        id: created.id,
        smartCollectionId: created.smartCollectionId,
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
        .delete(smartCollectionFilters)
        .where(eq(smartCollectionFilters.smartCollectionId, id)),
      db
        .delete(smartCollectionSorts)
        .where(eq(smartCollectionSorts.smartCollectionId, id)),
      db
        .delete(smartCollections)
        .where(
          and(eq(smartCollections.id, id), eq(smartCollections.userId, userId)),
        ),
    ]),
  );

  const remaining = await db
    .select({ id: smartCollections.id })
    .from(smartCollections)
    .where(eq(smartCollections.userId, userId))
    .orderBy(
      asc(smartCollections.displayOrder),
      desc(smartCollections.createdAt),
    );

  if (remaining.length > 0) {
    await db.batch(
      asBatch(
        remaining.map((row, index) =>
          db
            .update(smartCollections)
            .set({
              displayOrder: index,
              updatedAt: String(Math.floor(Date.now() / 1000)),
            })
            .where(eq(smartCollections.id, row.id)),
        ),
      ),
    );
  }

  return true;
}

export async function reorderUserCollections(
  userId: number,
  orderedIds: number[],
): Promise<SmartCollectionWithFilters[]> {
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
          .update(smartCollections)
          .set({
            displayOrder: index,
            updatedAt: String(Math.floor(Date.now() / 1000)),
          })
          .where(
            and(
              eq(smartCollections.id, id),
              eq(smartCollections.userId, userId),
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
    .select({ value: smartCollections.displayOrder })
    .from(smartCollections)
    .where(eq(smartCollections.userId, userId))
    .orderBy(desc(smartCollections.displayOrder))
    .limit(1);

  return Number(rows[0]?.value ?? -1) + 1;
}
