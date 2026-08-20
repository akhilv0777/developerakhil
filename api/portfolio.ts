import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureSchema, sql } from './_lib/db.js';
import { getSessionUser } from './_lib/auth.js';

const RESOURCE_KEYS = ['services', 'projects', 'education', 'experience', 'testimonials'] as const;

function isValidPortfolioPayload(value: unknown): value is Record<string, unknown[]> {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return RESOURCE_KEYS.every((key) => Array.isArray(record[key]));
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

      const payload = req.body;
      if (!isValidPortfolioPayload(payload)) {
        return res.status(400).json({ error: 'Malformed portfolio data.' });
      }

      await sql`
        UPDATE portfolio_content
        SET data = ${JSON.stringify(payload)}::jsonb, updated_at = now()
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
