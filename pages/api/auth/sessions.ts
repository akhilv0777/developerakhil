import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSessionUserFull,
  clearSessionCookie,
} from "@/lib/api-server/auth";
import {
  listAdminSessions,
  revokeAdminSession,
} from "@/lib/api-server/db";

function describeUserAgent(userAgent: string) {
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)
          ? "Safari"
          : /Opera|OPR\//.test(userAgent)
            ? "Opera"
            : "Unknown browser";
  const model = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android device"
        : /Windows NT/.test(userAgent)
          ? "Windows PC"
          : /Macintosh/.test(userAgent)
            ? "Mac"
            : /Linux/.test(userAgent)
              ? "Linux computer"
              : "Unknown device";
  return { browser, model };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionUserFull(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });

  if (req.method === 'DELETE') {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });
    const revoked = await revokeAdminSession(sessionId, session.username);
    if (!revoked) return res.status(404).json({ error: 'Session not found.' });
    if (sessionId === session.sessionId) clearSessionCookie(res);
    return res.status(200).json({ ok: true, current: sessionId === session.sessionId });
  }

  const result = await listAdminSessions(session.username);
  const sessions = result.rows.map((row) => ({
    id: row.id,
    ...describeUserAgent(String(row.user_agent || '')),
    location: row.location || 'Unknown location',
    ipAddress: row.ip_address || 'Unknown IP',
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    current: row.id === session.sessionId,
  }));
  return res.status(200).json({ sessions });
}