import { requireSession } from "@/lib/auth/session";
import { ok, toErrorResponse } from "@/lib/http/response";
import { getDiscoverRows } from "@/services/discover";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    return ok(await getDiscoverRows(session.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch discover rows",
      "Failed to fetch discover rows",
    );
  }
}
