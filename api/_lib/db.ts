import { Pool } from "pg";

/**
 * Different Postgres providers on the Vercel Marketplace name their env
 * vars differently, and some (like Prisma Postgres's DATABASE_URL) use a
 * proxy protocol (`prisma+postgres://`) that only Prisma's own client
 * understands. We look for the first variable that's an actual Postgres
 * wire-protocol URL, trying the most common names in order.
 */
function resolveConnectionString(): string {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
  ].filter((value): value is string => Boolean(value));

  const usable = candidates.find(
    (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
  );
  if (usable) return usable;

  if (candidates.length > 0) {
    const protocols = candidates.map((url) => url.split("://")[0]).join(", ");
    throw new Error(
      `Found a database env var, but it uses an unsupported protocol (${protocols}). ` +
        'This app needs a plain "postgres://" or "postgresql://" connection string — ' +
        'in your database provider\'s Vercel integration settings, look for a "direct connection" ' +
        'or "POSTGRES_URL" style value rather than a proxy/accelerate URL.',
    );
  }
  throw new Error(
    "No database connection string found. Set POSTGRES_URL or DATABASE_URL.",
  );
}

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: resolveConnectionString(),
      ssl: { rejectUnauthorized: false },
      max: 1, // keep connections per serverless instance low
    });
    // IMPORTANT: pg emits a background 'error' event on the pool when an
    // idle client's connection is dropped by the database (very common
    // with remote Postgres providers between serverless invocations).
    // If nothing listens for it, Node treats it as an unhandled error and
    // crashes the whole function process (Vercel shows this as
    // FUNCTION_INVOCATION_FAILED). Listening here just logs it and lets
    // the pool quietly create a fresh connection on the next query.
    pool.on("error", (err) => {
      console.error("Unexpected error on idle Postgres client:", err);
    });
  }
  return pool;
}

type QueryResult = { rows: any[]; rowCount: number };

/** Tagged template helper mirroring the `sql\`...\`` style used throughout this project. */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<QueryResult> {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + strings[i + 1];
  }
  const result = await getPool().query(text, values);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}


export const seedPortfolioData = {
  profile: {
    name: "Akhilesh Vishwakarma",
    tagline: "Full-stack developer / digital craftsman",
    location: "Lucknow, India",
    bio1: "I’m Akhilesh — a developer who likes products with a point of view.",
    bio2: "For the past 6 years, I’ve moved between interface, API, database, and the conversations that connect them. The best work happens when those boundaries get blurry.",
    bio3: "I work with people who have something worth making and need a partner who can bring both technical rigor and a human eye to the room.",
    email: "hello@akhilesh.dev",
    github: "github.com/akhilesh-v",
    image: "",
    resume: "",
    resumeName: "",
    contactTitle: "Have a\ngood one?",
    contactNote: "Currently accepting a few good problems.",
  },

  stats: [
    { id: "stat-1", value: "06", label: "years making" },
    { id: "stat-2", value: "38", label: "things shipped" },
    { id: "stat-3", value: "12", label: "happy teams" },
    { id: "stat-4", value: "∞", label: "tabs open" },
  ],
  services: [
    {
      id: "svc-1",
      number: "01",
      title: "Product engineering",
      description:
        "From first sketch to a reliable, fast product people want to use.",
    },
    {
      id: "svc-2",
      number: "02",
      title: "Web experiences",
      description:
        "Editorial, expressive interfaces with a little more soul than expected.",
    },
    {
      id: "svc-3",
      number: "03",
      title: "Design systems",
      description:
        "A shared visual language that lets a team move quickly without losing taste.",
    },
  ],
  projects: [
    {
      id: "prj-1",
      title: "Aster / finance for humans",
      category: "Product design + engineering",
      year: "2024",
      description:
        "A calmer way to understand the money moving through your life.",
      tags: "React, TypeScript, Product",
      accent: "lime",
    },
    {
      id: "prj-2",
      title: "Fieldnotes",
      category: "Editorial platform",
      year: "2023",
      description:
        "A living archive for curious people making things in the real world.",
      tags: "Next.js, CMS, Art direction",
      accent: "coral",
    },
    {
      id: "prj-3",
      title: "Morrow studio",
      category: "Brand system + web",
      year: "2023",
      description:
        "A new digital home for a studio working at the edge of materials and light.",
      tags: "WebGL, Motion, Strategy",
      accent: "blue",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.Tech, Computer Science",
      institution: "University of Mumbai",
      period: "2015 — 2019",
      detail:
        "Systems, algorithms, and the habit of taking things apart to see how they work.",
    },
    {
      id: "edu-2",
      degree: "The self-directed studio",
      institution: "Everywhere, always",
      period: "2019 — now",
      detail:
        "A continuing practice in visual design, typography, and making useful things.",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "Senior full-stack developer",
      company: "Independent / select partners",
      period: "2021 — now",
      detail:
        "Partnering with founders and small teams to turn ambitious ideas into shipped products.",
    },
    {
      id: "exp-2",
      role: "Full-stack developer",
      company: "Bynocs Technologies",
      period: "2019 — 2021",
      detail:
        "Built dependable web platforms and learned that good software begins with listening.",
    },
  ],
  testimonials: [
    {
      id: "tst-1",
      quote:
        "Akhilesh brings the rare combination of a sharp eye and the patience to make the hard parts simple.",
      name: "Riya Menon",
      role: "Founder, Common Thread",
    },
    {
      id: "tst-2",
      quote:
        "He made our product feel like us. Not just functional — unmistakably ours.",
      name: "Nikhil Shah",
      role: "Creative director, Morrow",
    },
  ],
};

let schemaReady: Promise<void> | null = null;

/**
 * Creates the tables on first use and idempotently seeds the single
 * portfolio_content row. Safe to call on every request — after the first
 * run it's just two fast existence checks.
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
      const existing =
        await sql`SELECT id FROM portfolio_content WHERE id = 1;`;
      if (existing.rowCount === 0) {
        await sql`
          INSERT INTO portfolio_content (id, data)
          VALUES (1, ${JSON.stringify(seedPortfolioData)}::jsonb);
        `;
      }

      await sql`
        UPDATE portfolio_content
        SET data = jsonb_set(data, '{stats}', ${JSON.stringify(seedPortfolioData.stats)}::jsonb, true),
            updated_at = now()
        WHERE id = 1 AND NOT (data ? 'stats');
      `;
    })();
  }
  return schemaReady;
}
