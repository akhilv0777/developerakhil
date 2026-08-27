import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { createAdminSession, getAdminSessionVersion, touchAdminSession } from "@/lib/api-server/db";

const COOKIE_NAME = "session";
const TRUSTED_DEVICE_COOKIE = "trusted_device";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const REMEMBERED_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const TRUSTED_DEVICE_DURATION_SECONDS = 60 * 60 * 24 * 30;

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
export function signSession(username: string, sessionVersion = 0, sessionId = randomUUID()): string {
  return jwt.sign({ sub: username, sv: sessionVersion, sid: sessionId }, getSecret(), {
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

export function setTrustedDeviceCookie(res: NextApiResponse, username: string): void {
  const token = jwt.sign({ sub: username, purpose: "trusted-device" }, getSecret(), { expiresIn: TRUSTED_DEVICE_DURATION_SECONDS });
  setCookie(res, TRUSTED_DEVICE_COOKIE, token, TRUSTED_DEVICE_DURATION_SECONDS);
}

export function getTrustedDeviceUser(req: NextApiRequest): string | null {
  const token = parseCookies(req.headers.cookie)[TRUSTED_DEVICE_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret()) as { sub?: string; purpose?: string };
    return payload.purpose === "trusted-device" ? payload.sub || null : null;
  } catch {
    return null;
  }
}

export function clearTrustedDeviceCookie(res: NextApiResponse): void {
  setCookie(res, TRUSTED_DEVICE_COOKIE, "", 0);
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
export async function getSessionUser(req: NextApiRequest): Promise<string | null> {
  return (await getSessionUserFull(req))?.username ?? null;
}

/**
 * Returns the username and session_version embedded in the JWT,
 * or null if the token is missing / invalid.
 * Callers that care about session invalidation should verify the returned
 * sessionVersion against the DB via getAdminSessionVersion().
 */
export async function getSessionUserFull(
  req: NextApiRequest,
): Promise<{ username: string; sessionVersion: number; sessionId: string } | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret()) as {
      sub: string;
      sv?: number;
      sid?: string;
    };
    if (!payload.sid) return null;
    const sessionVersion = typeof payload.sv === "number" ? payload.sv : 0;
    if (sessionVersion !== await getAdminSessionVersion(payload.sub)) return null;
    if (!await touchAdminSession(payload.sid, payload.sub)) return null;
    return {
      username: payload.sub,
      sessionVersion,
      sessionId: payload.sid,
    };
  } catch {
    return null;
  }
}

export async function createSessionForRequest(
  req: NextApiRequest,
  username: string,
  sessionVersion: number,
): Promise<string> {
  const sessionId = randomUUID();
  const forwardedFor = req.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";
  const country = req.headers["x-vercel-ip-country"] || "";
  const city = req.headers["x-vercel-ip-city"] || "";
  const location = [city, country].filter(Boolean).join(", ");
  await createAdminSession({ id: sessionId, username, userAgent, ipAddress, location });
  return signSession(username, sessionVersion, sessionId);
}

function setCookie(res: NextApiResponse, name: string, value: string, maxAge: number): void {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isProd) parts.push("Secure");
  const cookie = parts.join("; ");
  const existing = res.getHeader("Set-Cookie");
  const cookies = Array.isArray(existing)
    ? existing.map(String)
    : existing
      ? [String(existing)]
      : [];
  res.setHeader("Set-Cookie", [...cookies, cookie]);
}

export function setSessionCookie(res: NextApiResponse, token: string, rememberMe = false): void {
  setCookie(res, COOKIE_NAME, token, rememberMe ? REMEMBERED_SESSION_DURATION_SECONDS : SESSION_DURATION_SECONDS);
}

export function clearSessionCookie(res: NextApiResponse): void {
  setCookie(res, COOKIE_NAME, "", 0);
}
