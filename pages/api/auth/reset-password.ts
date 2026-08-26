import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/api-server/db';
import { verifyPasswordResetToken } from '@/lib/api-server/auth';
import { verifyTurnstile } from '@/lib/api-server/turnstile';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await verifyTurnstile(req.body?.["cf-turnstile-response"], req, 'reset-password'))) {
    return res.status(403).json({ error: 'Cloudflare verification failed. Please try again.' });
  }
  const { token, newPassword } = (req.body ?? {}) as { token?: string; newPassword?: string };
  const username = token ? verifyPasswordResetToken(token) : null;
  if (!username || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'This reset link is invalid or expired, or the password is too short.' });
  }
  try {
    await ensureSchema();
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await sql`UPDATE admin_users SET password_hash = ${hash} WHERE username = ${username};`;
    if (!result.rowCount) return res.status(400).json({ error: 'This reset link is invalid or expired.' });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
}