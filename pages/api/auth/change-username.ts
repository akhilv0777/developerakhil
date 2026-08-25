import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { ensureSchema, sql } from "@/lib/api-server/db";
import { getSessionUser, setSessionCookie, signSession } from "@/lib/api-server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const currentUsername = getSessionUser(req);
  if (!currentUsername) return res.status(401).json({ error: "Not authenticated." });

  const { currentPassword, newUsername } = (req.body ?? {}) as {
    currentPassword?: string;
    newUsername?: string;
  };
  const username = newUsername?.trim();

  if (!currentPassword || !username) {
    return res.status(400).json({ error: "New username and current password are required." });
  }
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3-32 characters: letters, numbers, dot, dash, or underscore." });
  }
  if (username === currentUsername) {
    return res.status(400).json({ error: "New username must be different from the current one." });
  }

  try {
    await ensureSchema();
    const result = await sql`SELECT username, password_hash FROM admin_users WHERE username = ${currentUsername} LIMIT 1;`;
    const user = result.rows[0] as { username: string; password_hash: string } | undefined;
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const duplicate = await sql`SELECT username FROM admin_users WHERE username = ${username} LIMIT 1;`;
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: "That username is already in use." });
    }

    await sql`UPDATE admin_users SET username = ${username} WHERE username = ${currentUsername};`;
    setSessionCookie(res, signSession(username));
    return res.status(200).json({ ok: true, username });
  } catch (error) {
    console.error("Change username error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
