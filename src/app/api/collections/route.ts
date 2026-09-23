import { requireSession } from "@/lib/auth/session";
import { readJsonBody } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import { createCollectionSchema } from "@/lib/validations/collections";
import { assertLocaleFilterValue } from "@/lib/validations/locales";
import {
  createUserCollection,
  getUserCollections,
} from "@/services/collections";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const collections = await getUserCollections(session.userId);
    return ok({ collections });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to fetch collections",
      "Failed to fetch collections",
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJsonBody(request, createCollectionSchema);
    for (const filter of body.filters) {
      await assertLocaleFilterValue(filter.field, filter.value);
    }

    const collection = await createUserCollection(session.userId, body);
    return ok({ collection }, 201);
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to create collection",
      "Failed to create collection",
    );
  }
}

