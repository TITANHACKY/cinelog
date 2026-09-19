import { requireSession } from "@/lib/auth/session";
import { readJsonBody } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import { reorderCollectionsSchema } from "@/lib/validations/collections";
import { reorderUserCollections } from "@/services/collections";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJsonBody(request, reorderCollectionsSchema);
    const collections = await reorderUserCollections(
      session.userId,
      body.orderedIds,
    );
    return ok({ collections });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to reorder collections",
      "Failed to reorder collections",
    );
  }
}
