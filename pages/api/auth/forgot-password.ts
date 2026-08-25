import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureSchema, getContactSettings, sql } from '@/lib/api-server/db';
import { signPasswordResetToken } from '@/lib/api-server/auth';
import { sendPasswordResetEmail } from '@/lib/api-server/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
  const generic = { message: 'If that account exists, a password reset link has been sent to the configured admin email.' };
  if (!identifier) return res.status(200).json(generic);

  try {
    await ensureSchema();
    const settings = await getContactSettings();
    const recipient = (settings.contactToEmail || process.env.GMAIL_USER || '').trim();
    const user = (await sql`SELECT username FROM admin_users WHERE username = ${identifier} LIMIT 1;`).rows[0] as { username: string } | undefined;
    const emailMatches = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier) && identifier.toLowerCase() === recipient.toLowerCase();
    const firstUser = emailMatches
      ? (await sql`SELECT username FROM admin_users ORDER BY id ASC LIMIT 1;`).rows[0] as { username: string } | undefined
      : undefined;
    const resetUsername = user?.username || firstUser?.username;
    if (resetUsername && recipient) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}`;
      await sendPasswordResetEmail({ recipient, resetUrl: `${origin}/reset-password?token=${encodeURIComponent(signPasswordResetToken(resetUsername))}` });
    }
    return res.status(200).json(generic);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(200).json(generic);
  }
}