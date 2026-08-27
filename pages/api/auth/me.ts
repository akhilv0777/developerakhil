import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/api-server/auth';

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
  const username = await getSessionUser(req);
  if (!username) {
    return res.status(401).json({ authenticated: false });
  }
  return res.status(200).json({ authenticated: true, username });
}
