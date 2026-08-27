import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/api-server/db';
import { ensureSchema, sql, getAdminSessionVersion } from '@/lib/api-server/db';
import { setSessionCookie, signSession } from '@/lib/api-server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { challengeId, otp } = (req.body ?? {}) as { challengeId?: string; otp?: string };
  if (!challengeId || typeof otp !== 'string' || !/^[0-9]{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Enter the 6-digit verification code.' });
  }

  try {
    await ensureSchema();
    const result = await sql`SELECT id, username, otp_hash, password_required, attempts FROM admin_login_challenges WHERE id = ${challengeId}::uuid AND expires_at > now() LIMIT 1;`;
    const challenge = result.rows[0] as { id: string; username: string; otp_hash: string; password_required: boolean; attempts: number } | undefined;
    if (!challenge || challenge.attempts >= 5) {
      return res.status(401).json({ error: 'This verification code is invalid or expired.' });
    }

    const matches = await bcrypt.compare(otp, challenge.otp_hash);
    if (!matches) {
      await sql`UPDATE admin_login_challenges SET attempts = attempts + 1 WHERE id = ${challengeId}::uuid;`;
      return res.status(401).json({ error: 'Incorrect verification code.' });
    }

    await sql`DELETE FROM admin_login_challenges WHERE id = ${challengeId}::uuid;`;
    setSessionCookie(res, signSession(challenge.username));
    const sessionVersion = await getAdminSessionVersion(challenge.username);
    setSessionCookie(res, signSession(challenge.username, sessionVersion));
    return res.status(200).json({ ok: true, username: challenge.username });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ error: 'Could not verify the code. Please try again.' });
  }
}