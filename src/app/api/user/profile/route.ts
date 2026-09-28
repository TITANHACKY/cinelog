import { requireSession, setAuthCookie } from "@/lib/auth/session";
import { readJsonBody } from "@/lib/http/request";
import { ok, toErrorResponse } from "@/lib/http/response";
import { updateProfileSchema } from "@/lib/validations/auth";
import { updateUserProfile } from "@/services/auth";

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJsonBody(request, updateProfileSchema);

    const { token, publicUser } = await updateUserProfile(session.userId, body);

    if (token) {
      await setAuthCookie(token);
    }

    return ok({ user: publicUser });
  } catch (error) {
    return toErrorResponse(
      error,
      "Profile update failed",
      "Failed to update profile",
    );
  }
}
