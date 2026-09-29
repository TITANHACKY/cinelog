import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/http/errors";
import { parseSchema } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import { discoverRowPageQuerySchema } from "@/lib/validations/discover";
import { getDiscoverRowPage } from "@/services/discover";

export const dynamic = "force-dynamic";

type DiscoverRowRouteContext = { params: Promise<{ key: string }> };

export async function GET(
  request: Request,
  { params }: DiscoverRowRouteContext,
) {
  try {
    const session = await requireSession();
    const { key } = await params;
    let decodedKey: string;
    try {
      decodedKey = decodeURIComponent(key);
    } catch {
      // Malformed %-escape, e.g. /rows/%25.
      throw new AppError("Invalid discover row", 400);
    }
    const { page } = parseSchema(discoverRowPageQuerySchema, {
      page: new URL(request.url).searchParams.get("page") ?? undefined,
    });
    return ok(await getDiscoverRowPage(session.userId, decodedKey, page));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch discover row",
      "Failed to fetch discover row",
    );
  }
}
