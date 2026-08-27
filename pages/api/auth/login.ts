import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'crypto';
import { ensureSchema, getAdminSessionVersion, getContactSettings, recordAdminNotification, sql } from '@/lib/api-server/db';
import { sendLoginOtpEmail } from '@/lib/api-server/mailer';
import { createSessionForRequest, getTrustedDeviceUser, setSessionCookie } from '@/lib/api-server/auth';
import { verifyTurnstile } from '@/lib/api-server/turnstile';

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

async function startOtpChallenge(username: string, recipient: string, passwordRequired: boolean, rememberMe: boolean, res: NextApiResponse) {
  const otp = String(randomInt(100000, 1000000));
  const challengeId = randomUUID();
  const otpHash = await bcrypt.hash(otp, 10);
  await sql`DELETE FROM admin_login_challenges WHERE expires_at <= now() OR username = ${username};`;
  await sql`INSERT INTO admin_login_challenges (id, username, otp_hash, password_required, remember_me, expires_at) VALUES (${challengeId}::uuid, ${username}, ${otpHash}, ${passwordRequired}, ${rememberMe}, now() + interval '10 minutes');`;
  await sendLoginOtpEmail({ recipient, otp });
  return res.status(200).json({ requiresOtp: true, challengeId, username });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    await recordAdminNotification({ title: 'Login rate limit reached', message: `Too many login attempts were detected from ${ip}.` });
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const { identifier, username, password, loginMode = 'password', rememberMe = false, turnstileToken, ['cf-turnstile-response']: turnstileResponse } = (req.body ?? {}) as { identifier?: string; username?: string; password?: string; loginMode?: 'password' | 'otp'; rememberMe?: boolean; turnstileToken?: string; 'cf-turnstile-response'?: string };
  const verificationToken = turnstileResponse || turnstileToken;
  if (!(await verifyTurnstile(verificationToken, req, 'auth'))) {
    await recordAdminNotification({ title: 'Cloudflare login verification failed', message: `A login attempt from ${ip} was blocked by Turnstile.` });
    return res.status(403).json({ error: 'Cloudflare verification failed. Please try again.' });
  }
  const loginIdentifier = (identifier || username || '').trim();
  if (!loginIdentifier || !['password', 'otp'].includes(loginMode) || (loginMode === 'password' && (!password || typeof password !== 'string')) || typeof loginIdentifier !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const passwordValue = typeof password === 'string' ? password : '';

  try {
    await ensureSchema();
    const settings = await getContactSettings();
    const adminEmail = (settings.contactToEmail || process.env.GMAIL_USER || '').trim().toLowerCase();
    const defaultAdminUsername = process.env.ADMIN_USERNAME?.trim() || 'admin';
    const defaultAdminPassword = process.env.ADMIN_PASSWORD?.trim() || 'admin123';

    if (loginMode === 'otp' && settings.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-step verification requires your password before the OTP.' });
    }

    if (loginMode === 'otp') {
      const isDefaultAdmin = loginIdentifier === defaultAdminUsername;
      const result = isDefaultAdmin
        ? { rows: [{ username: defaultAdminUsername }] }
        : await sql`SELECT username FROM admin_users WHERE username = ${loginIdentifier} LIMIT 1;`;
      const emailUser = !result.rows[0] && adminEmail && loginIdentifier.toLowerCase() === adminEmail
        ? (await sql`SELECT username FROM admin_users ORDER BY id ASC LIMIT 1;`).rows[0]
        : undefined;
      const otpUser = result.rows[0] || emailUser;
      if (!otpUser || !adminEmail) return res.status(401).json({ error: 'Invalid username or admin email.' });
      return startOtpChallenge(otpUser.username, adminEmail, false, Boolean(rememberMe), res);
    }

    if (loginIdentifier === defaultAdminUsername && passwordValue === defaultAdminPassword) {
      if (settings.twoFactorEnabled) {
        if (!adminEmail) return res.status(503).json({ error: 'Two-step verification is enabled but no admin email is configured.' });
        if (getTrustedDeviceUser(req) !== defaultAdminUsername) return startOtpChallenge(defaultAdminUsername, adminEmail, true, Boolean(rememberMe), res);
      }
      const token = await createSessionForRequest(req, defaultAdminUsername, await getAdminSessionVersion(defaultAdminUsername));
      setSessionCookie(res, token, Boolean(rememberMe));
      await recordAdminNotification({ title: 'Admin login successful', message: `${defaultAdminUsername} signed in successfully.` });
      return res.status(200).json({ ok: true, username: defaultAdminUsername });
    }

    const result = await sql`SELECT username, password_hash FROM admin_users WHERE username = ${loginIdentifier} LIMIT 1;`;
    const user = result.rows[0];
    const emailUser = !user && adminEmail && loginIdentifier.toLowerCase() === adminEmail
      ? (await sql`SELECT username, password_hash FROM admin_users ORDER BY id ASC LIMIT 1;`).rows[0]
      : undefined;
    const matchedUser = user || emailUser;

    // Always run bcrypt.compare (even with a dummy hash) so responses
    // take the same time whether or not the username exists.
    const hashToCheck = matchedUser?.password_hash ?? '$2a$10$invalidsaltinvalidsaltinvalidsaltinvalidsal';
    const passwordMatches = await bcrypt.compare(passwordValue, hashToCheck);

    if (!matchedUser || !passwordMatches) {
      await recordAdminNotification({ title: 'Failed admin login', message: `Invalid credentials were used for ${loginIdentifier}.` });
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (settings.twoFactorEnabled && getTrustedDeviceUser(req) !== matchedUser.username) {
      if (!adminEmail) return res.status(503).json({ error: 'Two-step verification is enabled but no admin email is configured.' });
      return startOtpChallenge(matchedUser.username, adminEmail, true, Boolean(rememberMe), res);
    }

    const token = await createSessionForRequest(req, matchedUser.username, await getAdminSessionVersion(matchedUser.username));
    setSessionCookie(res, token, Boolean(rememberMe));
    await recordAdminNotification({ title: 'Admin login successful', message: `${matchedUser.username} signed in successfully.` });
    return res.status(200).json({ ok: true, username: matchedUser.username });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return res.status(401).json({ error: 'Database is unavailable. Please try again later.' });
    }

    console.error('Login error:', error);
    await recordAdminNotification({ title: 'Admin login error', message: (error as Error).message || 'An unexpected login error occurred.' });
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
