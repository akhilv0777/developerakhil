import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUserFull } from '@/lib/api-server/auth';
import { getAdminSessionVersion } from '@/lib/api-server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Never let the browser/CDN cache the session check — a stale 304 here
  // could make the UI show the wrong logged-in state.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSessionUserFull(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  // Validate that the token's session_version still matches the DB.
  // If the admin triggered "logout all devices", the DB version will have
  // been bumped and this check will reject every older JWT immediately.
  try {
    const currentVersion = await getAdminSessionVersion(session.username);
    if (session.sessionVersion !== currentVersion) {
      return res.status(401).json({ authenticated: false });
    }
  } catch {
    // If DB is unavailable, fall back to accepting the token as-is
    // (keeps existing degraded-mode behavior).
  }

  return res.status(200).json({ authenticated: true, username: session.username });
}
