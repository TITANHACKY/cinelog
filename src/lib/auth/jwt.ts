import { SignJWT, jwtVerify } from "jose";
import { AUTH_TOKEN_TTL_SECONDS } from "@/lib/constants";
import { getJwtSecret } from "@/lib/auth/jwt-secret";

const JWT_SECRET = getJwtSecret();

type TokenClaims = {
  userId: number;
  username: string;
  onboarding?: "completed";
};

export async function signToken(payload: TokenClaims) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + AUTH_TOKEN_TTL_SECONDS;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenClaims & { exp: number };
  } catch {
    return null;
  }
}
