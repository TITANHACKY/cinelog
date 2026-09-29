import { getSession } from "@/lib/auth/session";
import { parsePositiveIntId } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import type { RouteContext } from "@/lib/types";
import { getFranchiseDetails } from "@/services/franchises";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const franchiseId = parsePositiveIntId(id, "franchise");
    const session = await getSession();
    return ok(await getFranchiseDetails(franchiseId, session?.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "TMDB franchise request failed",
      "Internal Server Error",
    );
  }
}
