import { FRANCHISES_PAGE_SIZE } from "@/lib/constants/library";
import { requireSession } from "@/lib/auth/session";
import { ok, toErrorResponse } from "@/lib/http/response";
import { getUserFollowedFranchises } from "@/services/franchises";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const limit =
      limitParam !== null
        ? Math.max(1, Math.min(100, Number(limitParam) || FRANCHISES_PAGE_SIZE))
        : FRANCHISES_PAGE_SIZE;
    const offset =
      offsetParam !== null ? Math.max(0, Number(offsetParam) || 0) : 0;

    const result = await getUserFollowedFranchises(session.userId, {
      limit,
      offset,
    });
    return ok(result);
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch followed franchises",
      "Internal Server Error",
    );
  }
}
