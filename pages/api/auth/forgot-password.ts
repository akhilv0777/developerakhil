import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureSchema, getContactSettings, sql } from '@/lib/api-server/db';
import { signPasswordResetToken } from '@/lib/api-server/auth';
import { sendPasswordResetEmail } from '@/lib/api-server/mailer';

function getPublicOrigin(req: NextApiRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const isLocalUrl = configuredUrl && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUrl);
  if (configuredUrl && !isLocalUrl) return configuredUrl;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  const forwardedHost = Array.isArray(req.headers['x-forwarded-host'])
    ? req.headers['x-forwarded-host'][0]
    : req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host || 'localhost:3000';
  const forwardedProto = Array.isArray(req.headers['x-forwarded-proto'])
    ? req.headers['x-forwarded-proto'][0]
    : req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`.replace(/\/$/, '');
}

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
      const origin = getPublicOrigin(req);
      await sendPasswordResetEmail({ recipient, resetUrl: `${origin}/reset-password?token=${encodeURIComponent(signPasswordResetToken(resetUsername))}` });
    }
    return res.status(200).json(generic);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(200).json(generic);
  }
}