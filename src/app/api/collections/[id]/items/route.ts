import { requireSession } from "@/lib/auth/session";
import { parsePositiveIntId } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import type { RouteContext } from "@/lib/types";
import { collectionItemsQuerySchema } from "@/lib/validations/collections";
import { getCollectionLibraryItems } from "@/services/collections";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const collectionId = parsePositiveIntId(id, "collection");
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const query = collectionItemsQuerySchema.parse({
      offset: searchParams.get("offset") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      group_key: searchParams.get("group_key") ?? undefined,
    });

    const result = await getCollectionLibraryItems(
      collectionId,
      session.userId,
      query,
    );

    return ok(result);
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to load collection items",
      "Failed to load collection items",
    );
  }
}
