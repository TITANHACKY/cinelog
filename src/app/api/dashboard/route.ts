import { requireSession } from "@/lib/auth/session";
import { ok, toErrorResponse } from "@/lib/http/response";
import { getDashboardData } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getDashboardData(session.userId);
    return ok(data);
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch dashboard data",
      "Failed to fetch dashboard data",
    );
  }
}
