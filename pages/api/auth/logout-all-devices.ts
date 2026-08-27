import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, clearSessionCookie, clearTrustedDeviceCookie } from '@/lib/api-server/auth';
import {
  ensureSchema,
  bumpAdminSessionVersion,
  revokeAllAdminSessions,
  recordAdminNotification,
} from '@/lib/api-server/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = await getSessionUser(req);
  if (!username) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    await ensureSchema();
    // Incrementing session_version in the DB invalidates every JWT that was
    // minted with the previous version — on any device, in any browser.
    await bumpAdminSessionVersion(username);
    await revokeAllAdminSessions(username);
    // Also clear the cookie on the current device.
    clearSessionCookie(res);
    clearTrustedDeviceCookie(res);
    await recordAdminNotification({
      title: 'Logged out of all devices',
      message: `${username} triggered a logout from all active sessions.`,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Logout all devices error:', error);
    return res
      .status(500)
      .json({ error: 'Could not log out all devices. Please try again.' });
  }
}
