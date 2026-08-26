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

export async function verifyTurnstile(token: unknown, req: NextApiRequest, expectedAction: string): Promise<boolean> {
  const settings = await getContactSettings();
  const secret = (settings.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || "").trim();
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