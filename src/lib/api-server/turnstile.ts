import type { NextApiRequest } from "next";
import { getContactSettings } from "@/lib/api-server/db";

type TurnstileResponse = { success?: boolean; action?: string; hostname?: string };

function normalizeHostname(value: string): string {
  const candidate = value.trim();
  if (!candidate) return "";
  try {
    return new URL(candidate.includes("://") ? candidate : `https://${candidate}`).hostname.toLowerCase();
  } catch {
    return candidate.split(/[/:#]/, 1)[0].toLowerCase();
  }
}

function isLocalDevelopmentHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\[::1\]/, "::1").replace(/:\d+$/, "").trim();
  if (!normalized || normalized === "localhost" || normalized === "0.0.0.0" || normalized === "::1" || normalized === "[::1]") return true;
  if (normalized.startsWith("127.")) return true;
  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
}

export async function verifyTurnstile(token: unknown, req: NextApiRequest, expectedAction: string): Promise<boolean> {
  const settings = await getContactSettings();
  const secret = (settings.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || "").trim();
  const host = ((req.headers["host"] || "") as string).toString();
  const forwardedHost = ((req.headers["x-forwarded-host"] || "") as string).toString();
  const originHost = ((req.headers["origin"] || "") as string).toString();
  const refererHost = ((req.headers["referer"] || "") as string).toString();
  const isLocalhostRequest = [host, forwardedHost, originHost, refererHost].some((value) => {
    if (!value) return false;
    try {
      return isLocalDevelopmentHostname(new URL(value).hostname);
    } catch {
      return isLocalDevelopmentHostname(value.replace(/^https?:\/\//, "").split(/[/?#]/, 1)[0]);
    }
  });

  if (process.env.NODE_ENV !== "production" && (isLocalhostRequest || !secret)) {
    return true;
  }

  if (!secret) return true;
  const expectedHostnames = new Set(
    (settings.turnstileHostnames || process.env.TURNSTILE_HOSTNAMES || "").split(",").map(normalizeHostname).filter(Boolean),
  );
  if (process.env.NODE_ENV !== "production") {
    expectedHostnames.add("localhost");
    expectedHostnames.add("127.0.0.1");
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || expectedHostnames.size === 0) return false;

  const forwardedFor = req.headers["x-forwarded-for"];
  const remoteip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim() || req.socket.remoteAddress;
  const form = new URLSearchParams({ secret, response: token });
  if (remoteip) form.set("remoteip", remoteip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const result = (await response.json()) as TurnstileResponse;
    return response.ok && result.success === true && result.action === expectedAction && !!result.hostname && expectedHostnames.has(normalizeHostname(result.hostname));
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}