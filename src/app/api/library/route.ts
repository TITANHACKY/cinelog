import { requireSession } from "@/lib/auth/session";
import { parseSchema } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import { libraryQuerySchema } from "@/lib/validations/library";
import { getLibrary } from "@/services/library";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const query = parseSchema(libraryQuerySchema, {
      type: searchParams.get("type") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      filter_field: searchParams.get("filter_field") ?? undefined,
      filter_operator: searchParams.get("filter_operator") ?? undefined,
      filter_value: searchParams.get("filter_value") ?? undefined,
      sort_field: searchParams.get("sort_field") ?? undefined,
      sort_direction: searchParams.get("sort_direction") ?? undefined,
      group_by: searchParams.get("group_by") ?? undefined,
      group_key: searchParams.get("group_key") ?? undefined,
    });
    const library = await getLibrary(session.userId, query);
    return ok(library);
  } catch (error) {
    return toErrorResponse(error, "Failed to load library", "Failed to load library");
  }
}
