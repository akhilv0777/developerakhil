import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureSchema, sql } from './_lib/db.js';
import { getSessionUser } from './_lib/auth.js';

const RESOURCE_KEYS = ['stats', 'services', 'projects', 'education', 'experience', 'testimonials'] as const;

/** Returns an empty array when the payload is valid, otherwise a list of
 * human-readable reasons — so a 400 always tells us (in the Vercel function
 * logs) exactly which field was wrong instead of just "Malformed". */
function describePortfolioPayloadErrors(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [`request body must be a JSON object, got ${Array.isArray(value) ? 'an array' : typeof value}`];
  }
  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of RESOURCE_KEYS) {
    if (!Array.isArray(record[key])) {
      errors.push(`"${key}" must be an array (got ${record[key] === undefined ? 'missing' : typeof record[key]})`);
    }
  }
  if (record.profile !== undefined && (typeof record.profile !== 'object' || record.profile === null || Array.isArray(record.profile))) {
    errors.push(`"profile" must be an object (got ${Array.isArray(record.profile) ? 'an array' : typeof record.profile})`);
  }
  return errors;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const result = await sql`SELECT data FROM portfolio_content WHERE id = 1;`;
      return res.status(200).json(result.rows[0]?.data ?? {});
    }

    if (req.method === 'PUT') {
      const username = getSessionUser(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      let payload = req.body;
      // On some payload sizes / content-type edge cases the platform can
      // hand us the raw JSON string instead of the parsed object — try to
      // parse it ourselves before giving up, instead of failing straight
      // away with a confusing "malformed" error.
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          // fall through — describePortfolioPayloadErrors will report this
        }
      }

      const payloadErrors = describePortfolioPayloadErrors(payload);
      if (payloadErrors.length > 0) {
        // Logged (not sent to the client) so it shows up in Vercel's
        // function logs — makes this reproducible/debuggable next time.
        console.error('Rejected PUT /api/portfolio — invalid payload:', payloadErrors);
        return res.status(400).json({ error: 'Malformed portfolio data.', details: payloadErrors });
      }

      const serialized = JSON.stringify(payload);
      // A resume/photo stored as a base64 data URL can get large. Vercel
      // serverless functions hard-cap the request body at ~4.5MB regardless
      // of anything we do here — if that's hit, the request never reaches
      // this code at all (it fails before parsing). This check catches the
      // case *just under* that cap so we return a clear, actionable error
      // instead of letting Postgres reject a huge JSONB value.
      const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4MB
      if (Buffer.byteLength(serialized, 'utf8') > MAX_PAYLOAD_BYTES) {
        return res.status(413).json({
          error: 'That save is too large (likely an uploaded photo or résumé). Try a smaller file.',
        });
      }

      await sql`
        UPDATE portfolio_content
        SET data = ${serialized}::jsonb, updated_at = now()
        WHERE id = 1;
      `;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
