import { requireSession } from "@/lib/auth/session";
import { ok, toErrorResponse } from "@/lib/http/response";
import { getUserFollowedFranchises } from "@/services/franchises";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const franchises = await getUserFollowedFranchises(session.userId);
    return ok({ franchises });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch followed franchises",
      "Internal Server Error",
    );
  }
}
