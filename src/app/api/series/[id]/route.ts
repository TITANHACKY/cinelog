import { getSession, requireSession } from "@/lib/auth/session";
import { parseJson, parsePositiveIntId, parseSchema } from "@/lib/http/request";
import { created, ok, toErrorResponse } from "@/lib/http/response";
import type { RouteContext } from "@/lib/types";
import { seriesPatchSchema } from "@/lib/validations/library";
import {
  addSeriesToLibrary,
  getSeriesDetails,
  removeSeriesFromLibrary,
  updateSeriesInLibrary,
} from "@/services/series";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const seriesId = parsePositiveIntId(id, "series");
    const session = await getSession();
    return ok(await getSeriesDetails(seriesId, session?.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "TMDB series request failed",
      "Internal Server Error",
    );
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tmdbId = parsePositiveIntId(id, "series");
    const session = await requireSession();
    return created(await addSeriesToLibrary(tmdbId, session.userId));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to insert series",
      "Internal Server Error",
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tmdbId = parsePositiveIntId(id, "series");
    const session = await requireSession();
    await removeSeriesFromLibrary(tmdbId, session.userId);
    return ok({ success: true });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to delete series",
      "Internal Server Error",
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tmdbId = parsePositiveIntId(id, "series");
    const session = await requireSession();
    const body = parseSchema(seriesPatchSchema, await parseJson(request));
    return ok(await updateSeriesInLibrary(tmdbId, session.userId, body));
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to update series",
      "Internal Server Error",
    );
  }
}
