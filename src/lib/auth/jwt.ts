import { SignJWT, jwtVerify } from "jose";
import { AUTH_TOKEN_TTL_SECONDS } from "@/lib/constants";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_super_secret_key_change_in_production"
);

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
