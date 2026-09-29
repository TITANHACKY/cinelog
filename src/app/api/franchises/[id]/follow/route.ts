import { requireSession } from "@/lib/auth/session";
import { parsePositiveIntId } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import type { RouteContext } from "@/lib/types";
import { followFranchise, unfollowFranchise } from "@/services/franchises";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const franchiseId = parsePositiveIntId(id, "franchise");
    const session = await requireSession();
    return ok(await followFranchise(franchiseId, session.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to follow franchise",
      "Internal Server Error",
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const franchiseId = parsePositiveIntId(id, "franchise");
    const session = await requireSession();
    return ok(await unfollowFranchise(franchiseId, session.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to unfollow franchise",
      "Internal Server Error",
    );
  }
}
