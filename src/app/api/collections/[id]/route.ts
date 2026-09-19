import { requireSession } from "@/lib/auth/session";
import { parsePositiveIntId, readJsonBody } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import type { RouteContext } from "@/lib/types";
import { updateCollectionSchema } from "@/lib/validations/collections";
import {
  deleteUserCollection,
  getUserCollection,
  updateUserCollection,
} from "@/services/collections";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const collectionId = parsePositiveIntId(id, "collection");
    const session = await requireSession();

    const collection = await getUserCollection(collectionId, session.userId);
    return ok({ collection });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch collection",
      "Failed to fetch collection",
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const collectionId = parsePositiveIntId(id, "collection");
    const session = await requireSession();
    const body = await readJsonBody(request, updateCollectionSchema);

    const collection = await updateUserCollection(
      collectionId,
      session.userId,
      body,
    );
    return ok({ collection });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to update collection",
      "Failed to update collection",
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const collectionId = parsePositiveIntId(id, "collection");
    const session = await requireSession();

    const collections = await deleteUserCollection(
      collectionId,
      session.userId,
    );
    return ok({ collections });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to delete collection",
      "Failed to delete collection",
    );
  }
}
