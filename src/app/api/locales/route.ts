import { ok, toErrorResponse } from "@/lib/http/response";
import { getLocales } from "@/services/locales";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locales = await getLocales();
    return ok(locales);
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch locales",
      "Failed to fetch locales",
    );
  }
}
