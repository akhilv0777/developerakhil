import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureSchema, seedPortfolioData, sql } from '@/lib/api-server/db';
import { getSessionUser } from '@/lib/api-server/auth';

const RESOURCE_KEYS = ['stats', 'services', 'projects', 'education', 'experience', 'testimonials'] as const;
let inMemoryPortfolioData = JSON.parse(JSON.stringify(seedPortfolioData));

function normalizePortfolioData(value: unknown) {
  const normalized = JSON.parse(JSON.stringify(value)) as typeof seedPortfolioData;
  normalized.profile.heroImage ||= normalized.profile.image || "";
  normalized.profile.aboutImage ||= normalized.profile.image || "";
  normalized.sectionVisibility.skills ??= true;
  const existingIds = new Set(normalized.testimonials.map((item) => item.id));
  normalized.testimonials = [
    ...normalized.testimonials,
    ...seedPortfolioData.testimonials.filter((item) => !existingIds.has(item.id)),
  ];
  return normalized;
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isReadMethod = req.method === 'GET';
  const isWriteMethod = req.method === 'PUT' || req.method === 'POST';

  try {
    // This API always reads live from Postgres and must never be served
    // from a cache — the browser, a CDN, or Vercel's edge network. Without
    // this, a save can succeed (200 from PUT, row updated in the DB) while
    // the very next GET still returns a stale cached copy (browsers were
    // seeing 304 Not Modified on /api/portfolio right after a fresh save).
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      await ensureSchema();
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      if (isReadMethod) {
        return res.status(200).json(inMemoryPortfolioData);
      }

      if (isWriteMethod) {
        return res.status(200).json({ ok: true, fallback: true, data: inMemoryPortfolioData });
      }
    }

    if (req.method === 'GET') {
      try {
        const result = await sql`SELECT data FROM portfolio_content WHERE id = 1;`;
        return res.status(200).json(normalizePortfolioData(result.rows[0]?.data ?? inMemoryPortfolioData));
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          return res.status(200).json(normalizePortfolioData(inMemoryPortfolioData));
        }
        throw error;
      }
    }

    if (req.method === 'PUT') {
      const username = await getSessionUser(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      try {
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

        try {
          await sql`
            UPDATE portfolio_content
            SET data = ${serialized}::jsonb, updated_at = now()
            WHERE id = 1;
          `;
        } catch (error) {
          if (isDatabaseUnavailableError(error)) {
            inMemoryPortfolioData = payload;
            return res.status(200).json({ ok: true, fallback: true, data: inMemoryPortfolioData });
          }
          throw error;
        }

        inMemoryPortfolioData = payload;
        return res.status(200).json({ ok: true });
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          return res.status(200).json({ ok: true, fallback: true, data: inMemoryPortfolioData });
        }
        throw error;
      }
    }

    if (req.method === 'POST') {
      const username = await getSessionUser(req);
      if (!username) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      try {
        let payload = req.body;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = null;
          }
        }
        if (!payload || payload.action !== 'reset') {
          return res.status(400).json({ error: 'Reset action required.' });
        }

        // Keep the default content on the server. The browser only requests
        // this operation; it never owns or sends the canonical seed payload.
        try {
          await sql`
            UPDATE portfolio_content
            SET data = ${JSON.stringify(seedPortfolioData)}::jsonb, updated_at = now()
            WHERE id = 1;
          `;
        } catch (error) {
          if (isDatabaseUnavailableError(error)) {
            inMemoryPortfolioData = JSON.parse(JSON.stringify(seedPortfolioData));
            return res.status(200).json(inMemoryPortfolioData);
          }
          throw error;
        }

        inMemoryPortfolioData = JSON.parse(JSON.stringify(seedPortfolioData));
        return res.status(200).json(inMemoryPortfolioData);
      } catch (error) {
        if (isDatabaseUnavailableError(error)) {
          inMemoryPortfolioData = JSON.parse(JSON.stringify(seedPortfolioData));
          return res.status(200).json(inMemoryPortfolioData);
        }
        throw error;
      }
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
