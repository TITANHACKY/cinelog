import { cookies } from "next/headers";
import { AppError } from "@/lib/http/errors";
import { signToken, verifyToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE, AUTH_TOKEN_TTL_SECONDS } from "@/lib/constants";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge,
    path: "/",
  };
}

export async function setAuthCookie(token: string) {
  (await cookies()).set(AUTH_COOKIE, token, cookieOptions(AUTH_TOKEN_TTL_SECONDS));
}

export async function clearAuthCookie() {
  (await cookies()).set(AUTH_COOKIE, "", cookieOptions(0));
}

export async function getSession() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new AppError("Unauthorized", 401);
  }
  return session;
}

export async function createSessionToken(user: {
  userId: number;
  username: string;
  onboarding?: "completed";
}) {
  return signToken(user);
}
