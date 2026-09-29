import { requireSession } from "@/lib/auth/session";
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
    const { page } = parseSchema(discoverRowPageQuerySchema, {
      page: new URL(request.url).searchParams.get("page") ?? undefined,
    });
    // Keys only contain [a-z0-9:-], so decoding is idempotent.
    return ok(
      await getDiscoverRowPage(session.userId, decodeURIComponent(key), page),
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch discover row",
      "Failed to fetch discover row",
    );
  }
}
