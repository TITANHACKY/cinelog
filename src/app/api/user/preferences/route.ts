import {
  createSessionToken,
  requireSession,
  setAuthCookie,
} from "@/lib/auth/session";
import { readJsonBody } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import { preferencesSchema } from "@/lib/validations/onboarding";
import { getUserPreferences, saveUserPreferences } from "@/services/preferences";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const preferences = await getUserPreferences(session.userId);
    return ok({ preferences });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to load preferences",
      "Failed to load preferences",
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJsonBody(request, preferencesSchema);
    const { tokenReissueNeeded } = await saveUserPreferences(
      session.userId,
      body,
    );

    if (tokenReissueNeeded) {
      const token = await createSessionToken({
        userId: session.userId,
        username: session.username,
        onboarding: "completed",
      });
      await setAuthCookie(token);
    }

    return ok({ success: true });
  } catch (error) {
    return toErrorResponse(
      error,
      "Failed to save preferences",
      "Failed to save preferences",
    );
  }
}
