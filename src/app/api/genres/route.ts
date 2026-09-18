import { ok, toErrorResponse } from "@/lib/http/response";
import { getGenres } from "@/services/genres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const genres = await getGenres();
    return ok({ genres });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch genres",
      "Failed to fetch genres",
    );
  }
}
