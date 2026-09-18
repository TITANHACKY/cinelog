import { getSession, requireSession } from "@/lib/auth/session";
import { parseJson, parsePositiveIntId, parseSchema } from "@/lib/http/request";
import { created, ok, toErrorResponse } from "@/lib/http/response";
import type { RouteContext } from "@/lib/types";
import { moviePatchSchema } from "@/lib/validations/library";
import {
  addMovieToLibrary,
  getMovieDetails,
  removeMovieFromLibrary,
  updateMovieInLibrary,
} from "@/services/movies";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const movieId = parsePositiveIntId(id, "movie");
    const session = await getSession();
    return ok(await getMovieDetails(movieId, session?.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "TMDB movie request failed",
      "Internal Server Error",
    );
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tmdbId = parsePositiveIntId(id, "movie");
    const session = await requireSession();
    return created(await addMovieToLibrary(tmdbId, session.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to insert movie",
      "Internal Server Error",
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tmdbId = parsePositiveIntId(id, "movie");
    const session = await requireSession();
    await removeMovieFromLibrary(tmdbId, session.userId);
    return ok({ success: true });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to delete movie",
      "Internal Server Error",
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tmdbId = parsePositiveIntId(id, "movie");
    const session = await requireSession();
    const body = parseSchema(moviePatchSchema, await parseJson(request));
    return ok(await updateMovieInLibrary(tmdbId, session.userId, body));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to update movie",
      "Internal Server Error",
    );
  }
}
