import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";

const COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "dev-local-jwt-secret-change-me");
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return secret;
}

/** Signs a new session JWT embedding the current session_version for the user. */
export function signSession(username: string, sessionVersion = 0): string {
  return jwt.sign({ sub: username, sv: sessionVersion }, getSecret(), {
    expiresIn: SESSION_DURATION_SECONDS,
  });
}

export function signPasswordResetToken(username: string): string {
  return jwt.sign({ sub: username, purpose: "password-reset" }, getSecret(), {
    expiresIn: 15 * 60,
  });
}

export function verifyPasswordResetToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getSecret()) as {
      sub?: string;
      purpose?: string;
    };
    return payload.purpose === "password-reset" && payload.sub
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

/** Returns the logged-in username, or null if the request has no valid session. */
export function getSessionUser(req: NextApiRequest): string | null {
  return getSessionUserFull(req)?.username ?? null;
}

/**
 * Returns the username and session_version embedded in the JWT,
 * or null if the token is missing / invalid.
 * Callers that care about session invalidation should verify the returned
 * sessionVersion against the DB via getAdminSessionVersion().
 */
export function getSessionUserFull(
  req: NextApiRequest,
): { username: string; sessionVersion: number } | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret()) as {
      sub: string;
      sv?: number;
    };
    return {
      username: payload.sub,
      // Legacy tokens minted before this feature was added won't have 'sv'.
      // Treat them as version 0 — they'll be invalidated once the user
      // triggers "logout all devices" (which bumps the DB version above 0).
      sessionVersion: typeof payload.sv === "number" ? payload.sv : 0,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, token: string): void {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
  ];
  if (isProd) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res: NextApiResponse): void {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProd) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
