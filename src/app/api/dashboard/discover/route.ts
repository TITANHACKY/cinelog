import { requireSession } from "@/lib/auth/session";
import { ok, toErrorResponse } from "@/lib/http/response";
import { getDiscoverLayout } from "@/services/discover";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    return ok(await getDiscoverLayout(session.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch discover layout",
      "Failed to fetch discover layout",
    );
  }
}
