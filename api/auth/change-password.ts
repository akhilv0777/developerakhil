import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { ensureSchema, sql } from "../_lib/db.js";
import { getSessionUser } from "../_lib/auth.js";

// Same lightweight per-instance rate limiter pattern as login.ts.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket?.remoteAddress ||
    "unknown";
  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: "Too many attempts. Try again later." });
  }

  const username = getSessionUser(req);
  if (!username) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const { currentPassword, newPassword } = (req.body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (
    !currentPassword ||
    !newPassword ||
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Current and new password are required." });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters." });
  }
  if (newPassword === currentPassword) {
    return res
      .status(400)
      .json({ error: "New password must be different from the current one." });
  }

  try {
    await ensureSchema();

    const result =
      await sql`SELECT username, password_hash FROM admin_users WHERE username = ${username} LIMIT 1;`;
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );
    if (!passwordMatches) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE admin_users SET password_hash = ${newHash} WHERE username = ${username};`;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
