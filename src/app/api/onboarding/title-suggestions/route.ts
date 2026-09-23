import { requireSession } from "@/lib/auth/session";
import { fail, ok, toErrorResponse } from "@/lib/http/response";
import { titleSuggestionsQuerySchema } from "@/lib/validations/onboarding";
import { getTitleSuggestions } from "@/services/onboarding-suggestions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireSession();
    const url = new URL(request.url);
    const parsed = titleSuggestionsQuerySchema.safeParse({
      genres: url.searchParams.get("genres") ?? undefined,
      mediaType: url.searchParams.get("mediaType") ?? undefined,
      languages: url.searchParams.get("languages") ?? undefined,
      minRating: url.searchParams.get("minRating") ?? undefined,
      eras: url.searchParams.get("eras") ?? undefined,
    });
    if (!parsed.success) {
      return fail("Invalid suggestion parameters", 400);
    }

    const titles = await getTitleSuggestions({
      genreIds: parsed.data.genres,
      mediaLean: parsed.data.mediaType,
      languages: parsed.data.languages,
      minRating: parsed.data.minRating,
      eras: parsed.data.eras,
    });
    return ok({ titles });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to load suggestions",
      "Failed to load suggestions",
    );
  }
}
