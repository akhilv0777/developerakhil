import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '../_lib/db.js';
import { signSession, setSessionCookie } from '../_lib/auth.js';

// Very small in-memory rate limiter per serverless instance. Not a
// substitute for a real WAF, but it slows down naive brute forcing.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    await ensureSchema();
    const result = await sql`SELECT username, password_hash FROM admin_users WHERE username = ${username} LIMIT 1;`;
    const user = result.rows[0];

    // Always run bcrypt.compare (even with a dummy hash) so responses
    // take the same time whether or not the username exists.
    const hashToCheck = user?.password_hash ?? '$2a$10$invalidsaltinvalidsaltinvalidsaltinvalidsal';
    const passwordMatches = await bcrypt.compare(password, hashToCheck);

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signSession(user.username);
    setSessionCookie(res, token);
    return res.status(200).json({ ok: true, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
