import { neon } from '@neondatabase/serverless';

// Vercel's Postgres Marketplace integration (Neon under the hood) injects
// DATABASE_URL. POSTGRES_URL is kept as a fallback for older setups.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL (or POSTGRES_URL) environment variable is not set.');
}
export const sql = neon(connectionString, { fullResults: true });

// The default content the site ships with. Used only to seed the
// database the very first time /api/portfolio is called and the
// table is empty — after that, everything lives in Postgres.
export const seedPortfolioData = {
  services: [
    { id: 'svc-1', number: '01', title: 'Product engineering', description: 'From first sketch to a reliable, fast product people want to use.' },
    { id: 'svc-2', number: '02', title: 'Web experiences', description: 'Editorial, expressive interfaces with a little more soul than expected.' },
    { id: 'svc-3', number: '03', title: 'Design systems', description: 'A shared visual language that lets a team move quickly without losing taste.' },
  ],
  projects: [
    { id: 'prj-1', title: 'Aster / finance for humans', category: 'Product design + engineering', year: '2024', description: 'A calmer way to understand the money moving through your life.', tags: 'React, TypeScript, Product', accent: 'lime' },
    { id: 'prj-2', title: 'Fieldnotes', category: 'Editorial platform', year: '2023', description: 'A living archive for curious people making things in the real world.', tags: 'Next.js, CMS, Art direction', accent: 'coral' },
    { id: 'prj-3', title: 'Morrow studio', category: 'Brand system + web', year: '2023', description: 'A new digital home for a studio working at the edge of materials and light.', tags: 'WebGL, Motion, Strategy', accent: 'blue' },
  ],
  education: [
    { id: 'edu-1', degree: 'B.Tech, Computer Science', institution: 'University of Mumbai', period: '2015 — 2019', detail: 'Systems, algorithms, and the habit of taking things apart to see how they work.' },
    { id: 'edu-2', degree: 'The self-directed studio', institution: 'Everywhere, always', period: '2019 — now', detail: 'A continuing practice in visual design, typography, and making useful things.' },
  ],
  experience: [
    { id: 'exp-1', role: 'Senior full-stack developer', company: 'Independent / select partners', period: '2021 — now', detail: 'Partnering with founders and small teams to turn ambitious ideas into shipped products.' },
    { id: 'exp-2', role: 'Full-stack developer', company: 'Bynocs Technologies', period: '2019 — 2021', detail: 'Built dependable web platforms and learned that good software begins with listening.' },
  ],
  testimonials: [
    { id: 'tst-1', quote: 'Akhilesh brings the rare combination of a sharp eye and the patience to make the hard parts simple.', name: 'Riya Menon', role: 'Founder, Common Thread' },
    { id: 'tst-2', quote: 'He made our product feel like us. Not just functional — unmistakably ours.', name: 'Nikhil Shah', role: 'Creative director, Morrow' },
  ],
};

let schemaReady: Promise<void> | null = null;

/**
 * Creates the tables on first use and idempotently seeds the single
 * portfolio_content row. Safe to call on every request — after the
 * first run it's just two fast existence checks.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS portfolio_content (
          id INTEGER PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT single_row CHECK (id = 1)
        );
      `;
      const existing = await sql`SELECT id FROM portfolio_content WHERE id = 1;`;
      if (existing.rowCount === 0) {
        await sql`
          INSERT INTO portfolio_content (id, data)
          VALUES (1, ${JSON.stringify(seedPortfolioData)}::jsonb);
        `;
      }
    })();
  }
  return schemaReady;
}
