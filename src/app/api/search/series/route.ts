import { getSession } from "@/lib/auth/session";
import { fail, ok, toErrorResponse } from "@/lib/http/response";
import { parseSearchQuery } from "@/lib/validations/search";
import { searchTitles } from "@/services/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const parsedQuery = parseSearchQuery(request.url);

    if (!parsedQuery.success) {
      const queryIssue = parsedQuery.error.issues.find(
        (issue) => issue.path[0] === "query",
      );
      return fail(
        queryIssue
          ? "The query parameter must be a non-empty string"
          : "Invalid search parameters",
        400,
      );
    }

    const session = await getSession();
    const { query, year, language, page } = parsedQuery.data;

    return ok(
      await searchTitles({
        query,
        type: "tv",
        userId: session?.userId,
        year,
        language,
        page,
      }),
    );
  } catch (error) {
    return toErrorResponse(
      error,
      "TMDB search request failed",
      "TMDB search request failed",
    );
  }
}
