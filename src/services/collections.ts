import { AppError } from "@/lib/http/errors";
import { collectionToLibraryQuery } from "@/lib/media/collection-query";
import { getLibrary } from "@/services/library";
import type {
  CreateCollectionInput,
  CollectionItemsQueryInput,
  UpdateCollectionInput,
} from "@/lib/validations/collections";
import {
  deleteUserCollection as repoDeleteCollection,
  findUserCollectionById,
  insertUserCollection,
  listUserCollections,
  nextDisplayOrder,
  reorderUserCollections as repoReorderCollections,
  updateUserCollection as repoUpdateCollection,
} from "@/repositories/collections";
export async function getUserCollections(userId: number) {
  return listUserCollections(userId);
}

export async function getUserCollection(id: number, userId: number) {
  const collection = await findUserCollectionById(id, userId);
  if (!collection) {
    throw new AppError("Collection not found", 404);
  }
  return collection;
}

export async function createUserCollection(
  userId: number,
  input: CreateCollectionInput,
) {
  const displayOrder =
    input.displayOrder > 0 ? input.displayOrder : await nextDisplayOrder(userId);
  return insertUserCollection(userId, { ...input, displayOrder });
}

export async function updateUserCollection(
  id: number,
  userId: number,
  input: UpdateCollectionInput,
) {
  const updated = await repoUpdateCollection(id, userId, input);
  if (!updated) {
    throw new AppError("Collection not found", 404);
  }
  return updated;
}

export async function deleteUserCollection(id: number, userId: number) {
  const deleted = await repoDeleteCollection(id, userId);
  if (!deleted) {
    throw new AppError("Collection not found", 404);
  }
  return listUserCollections(userId);
}

export async function reorderUserCollections(
  userId: number,
  orderedIds: number[],
) {
  try {
    return await repoReorderCollections(userId, orderedIds);
  } catch {
    throw new AppError("Invalid collection order", 400);
  }
}

export async function getCollectionLibraryItems(
  id: number,
  userId: number,
  query: CollectionItemsQueryInput,
) {
  const collection = await getUserCollection(id, userId);
  const libraryQuery = collectionToLibraryQuery(collection, {
    offset: query.offset,
    limit: query.limit,
    q: query.q,
    groupKey: query.group_key,
  });

  const library = await getLibrary(userId, libraryQuery);
  const isMovie = collection.mediaType === 0;

  return {
    collection,
    movies: isMovie ? library.movies : [],
    series: isMovie ? [] : library.series,
    metadata: library.metadata,
  };
}
