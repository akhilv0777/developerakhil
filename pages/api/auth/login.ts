import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/api-server/db';
import { getContactSettings } from '@/lib/api-server/db';
import { signSession, setSessionCookie } from '@/lib/api-server/auth';

// Very small in-memory rate limiter per serverless instance. Not a
// substitute for a real WAF, but it slows down naive brute forcing.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof AggregateError) {
    return error.errors.some((err) => isDatabaseUnavailableError(err));
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown; errno?: unknown; message?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : '';
  const errno = typeof candidate.errno === 'number' || typeof candidate.errno === 'string' ? String(candidate.errno) : '';
  const message = typeof candidate.message === 'string' ? candidate.message : '';

  return (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ENOTFOUND' ||
    errno === '-4078' ||
    /ECONNREFUSED|ECONNRESET|connect/i.test(message)
  );
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const { identifier, username, password } = (req.body ?? {}) as { identifier?: string; username?: string; password?: string };
  const loginIdentifier = (identifier || username || '').trim();
  if (!loginIdentifier || !password || typeof loginIdentifier !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const defaultAdminUsername = process.env.ADMIN_USERNAME?.trim() || 'admin';
  const defaultAdminPassword = process.env.ADMIN_PASSWORD?.trim() || 'admin123';

  if (loginIdentifier === defaultAdminUsername && password === defaultAdminPassword) {
    const token = signSession(defaultAdminUsername);
    setSessionCookie(res, token);
    return res.status(200).json({ ok: true, username: defaultAdminUsername });
  }

  try {
    await ensureSchema();
    const settings = await getContactSettings();
    const adminEmail = (settings.contactToEmail || process.env.GMAIL_USER || '').trim().toLowerCase();
    const result = await sql`SELECT username, password_hash FROM admin_users WHERE username = ${loginIdentifier} LIMIT 1;`;
    const user = result.rows[0];
    const emailUser = !user && adminEmail && loginIdentifier.toLowerCase() === adminEmail
      ? (await sql`SELECT username, password_hash FROM admin_users ORDER BY id ASC LIMIT 1;`).rows[0]
      : undefined;
    const matchedUser = user || emailUser;

    // Always run bcrypt.compare (even with a dummy hash) so responses
    // take the same time whether or not the username exists.
    const hashToCheck = matchedUser?.password_hash ?? '$2a$10$invalidsaltinvalidsaltinvalidsaltinvalidsal';
    const passwordMatches = await bcrypt.compare(password, hashToCheck);

    if (!matchedUser || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signSession(matchedUser.username);
    setSessionCookie(res, token);
    return res.status(200).json({ ok: true, username: matchedUser.username });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return res.status(401).json({ error: 'Database is unavailable. Please try again later.' });
    }

    console.error('Login error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
