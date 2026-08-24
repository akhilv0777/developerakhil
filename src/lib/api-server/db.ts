import bcrypt from "bcryptjs";
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

  // Handle Prisma Postgres local proxy URLs by decoding the api_key base64 payload
  const prismaPgUrl = candidates.find((url) => url.startsWith("prisma+postgres://"));
  if (prismaPgUrl) {
    try {
      const urlObj = new URL(prismaPgUrl);
      let apiKey = urlObj.searchParams.get("api_key");
      if (apiKey) {
        // Fix base64url encoding
        apiKey = apiKey.replace(/-/g, "+").replace(/_/g, "/");
        const pad = apiKey.length % 4;
        if (pad) {
          apiKey += "=".repeat(4 - pad);
        }
        const decoded = Buffer.from(apiKey, "base64").toString("utf8");
        const payload = JSON.parse(decoded);
        if (payload.databaseUrl) {
          return payload.databaseUrl;
        }
      }
    } catch (err) {
      console.warn("Failed to parse prisma+postgres URL", err);
    }
  }

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

// The default content the site ships with. Used only to seed the
// database the very first time /api/portfolio is called and the
// table is empty — after that, everything lives in Postgres.
export const seedPortfolioData = {
  profile: {
    name: "Akhilesh Vishwakarma",
    tagline: "Available for freelance work",
    roles: ["Developer", "WordPress Expert", "Creator"],
    whatsapp: "+916386991576",
    location: "Lucknow, Uttar Pradesh, India",
    bio1: "Result-oriented Software Developer with extensive expertise in PHP, Laravel, and WordPress ecosystem development.",
    bio2: "Proficient in building advanced Gutenberg block architecture using React, extending core WordPress capabilities, and developing robust backend systems with Laravel.",
    bio3: "Track record of delivering scalable web solutions, optimizing core database queries, and writing clean, standardized, and maintainable code.",
    email: "akhilv0777@gmail.com",
    phone: "+91 6386991576",
    github: "github.com/akhilv0777",
    linkedin: "linkedin.com/in/akhilv0777",
    image: "",
    resume: "",
    resumeName: "",
    contactTitle: "Have a\ngood one?",
    contactNote: "Currently accepting a few good problems.",
    skills: ["WordPress", "Gutenberg", "React.js", "PHP", "Laravel", "MySQL", "JavaScript", "HTML5/CSS3"],
    languages: ["English (Professional)", "Hindi (Native)"]
  },
  stats: [
    { id: "stat-1", value: "02", label: "Years Experience" },
    { id: "stat-2", value: "05", label: "Projects Shipped" },
    { id: "stat-3", value: "03", label: "Companies" },
    { id: "stat-4", value: "99", label: "% Uptime Record" },
  ],
  services: [
    {
      id: "svc-1",
      number: "01",
      title: "WordPress Development",
      description: "Custom Gutenberg Blocks (React-driven), Block Validation Management, Theme/Plugin Development.",
    },
    {
      id: "svc-2",
      number: "02",
      title: "Backend Development",
      description: "PHP (Core & OOP), Laravel Framework, MVC Architecture, RESTful API Development, Query Optimization.",
    },
    {
      id: "svc-3",
      number: "03",
      title: "Frontend Development",
      description: "React.js, JavaScript (ES6+), HTML5, CSS3, Bootstrap, Responsive UI.",
    },
  ],
  projects: [
    {
      id: "prj-1",
      title: "Custom Font-Icon Block Architecture for Gutenberg",
      category: "WordPress / React / PHP",
      year: "2024",
      description: "Designed a specialized custom Gutenberg block extension enabling streamlined integration of customized font icons directly inside the block builder interface. Engineered an advanced save function to guarantee high-fidelity serialization of UI elements without breaking core editor validation rules.",
      tags: "WordPress, React, PHP",
      accent: "lime",
    },
    {
      id: "prj-2",
      title: "Dynamic Multi-Tenant Application Platform",
      category: "Laravel / MySQL / REST API",
      year: "2023",
      description: "Engineered a production-ready Laravel portal featuring comprehensive administrative controllers, automated routing, and robust middleware security configurations. Built fully decoupled RESTful endpoints handling asynchronous communications between responsive front-end interfaces and relational database frameworks.",
      tags: "Laravel, REST API, MySQL",
      accent: "coral",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.Tech in Computer Science & Engineering",
      institution: "Shrinathji Institute For Technical Education, Meerut",
      period: "2026 — 2029 (Expected)",
      detail: "Pursuing",
    },
    {
      id: "edu-2",
      degree: "Diploma in Computer Science & Engineering",
      institution: "FGP Raebareli",
      period: "2020 — 2023",
      detail: "Score: 69%",
    },
    {
      id: "edu-3",
      degree: "High School",
      institution: "SDIC Goluka Amethi",
      period: "2016 — 2017",
      detail: "Score: 64%",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "PHP & WordPress Developer",
      company: "SLICEmyPAGE | Lucknow, Uttar Pradesh",
      period: "July 2024 — PRESENT",
      detail: "Spearheading the architecture and implementation of dynamic, React-based custom Gutenberg blocks tailored for complex layout and typography configurations.",
    },
    {
      id: "exp-2",
      role: "PHP Developer",
      company: "Eucoders Technology | Lucknow, Uttar Pradesh",
      period: "2023 — 2024",
      detail: "Built and maintained dynamic web application backends and client-facing business portals powered by core PHP and Laravel frameworks.",
    },
    {
      id: "exp-3",
      role: "Web Development Intern",
      company: "Eucoders Technologies",
      period: "4 Months",
      detail: "Acquired real-world industry experience managing version control workflows and contributing to full-stack web application development lifecycles.",
    },
  ],
  testimonials: [
    {
      id: "tst-1",
      quote: "Akhilesh brings the rare combination of a sharp eye and the patience to make the hard parts simple.",
      name: "Riya Menon",
      role: "Founder, Common Thread",
    },
  ],
  sectionVisibility: {
    hero: true,
    about: true,
    stats: true,
    marquee: true,
    education: true,
    experience: true,
    services: true,
    projects: true,
    testimonials: true,
    contact: true,
  },
  themeSettings: {
    accentColor: "#00FF88",
    mode: "dark",
  }
};

export type ContactSettings = {
  gmailAppPassword: string;
  contactToEmail: string;
  contactFromEmail: string;
};

const defaultContactSettings: ContactSettings = {
  gmailAppPassword: "",
  contactToEmail: "",
  contactFromEmail: "",
};

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  replied: boolean;
  repliedAt: string | null;
};

let schemaReady: Promise<void> | null = null;

/**
 * Creates the tables on first use and idempotently seeds the single
 * portfolio_content row. Safe to call on every request — after the
 * first run it's just a few fast existence checks.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
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

        const defaultAdminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
        const defaultAdminPassword = process.env.ADMIN_PASSWORD?.trim() || "admin123";
        const defaultAdminHash = await bcrypt.hash(defaultAdminPassword, 10);
        await sql`
          INSERT INTO admin_users (username, password_hash)
          VALUES (${defaultAdminUsername}, ${defaultAdminHash})
          ON CONFLICT (username) DO NOTHING;
        `;

        // Contact-form settings (Resend API key + addresses). Single-row
        // table, same pattern as portfolio_content — edited from the admin
        // Settings tab instead of environment variables so it's changeable
        // without a redeploy.
        await sql`
          CREATE TABLE IF NOT EXISTS contact_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT single_row CHECK (id = 1)
          );
        `;
        const existingSettings =
          await sql`SELECT id FROM contact_settings WHERE id = 1;`;
        if (existingSettings.rowCount === 0) {
          await sql`
            INSERT INTO contact_settings (id, data)
            VALUES (1, ${JSON.stringify(defaultContactSettings)}::jsonb);
          `;
        }

        // Submissions from the public contact form, viewable/deletable from
        // the admin Messages tab.
        await sql`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            replied BOOLEAN NOT NULL DEFAULT false,
            replied_at TIMESTAMPTZ
          );
        `;

        // Try adding the replied columns if they don't exist (in case of an existing table)
        try {
          await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied BOOLEAN NOT NULL DEFAULT false;`;
          await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;`;
        } catch (e) {
          // Ignore if error
        }
      } catch (error) {
        schemaReady = null;
        throw error;
      }
    })();
  }
  return schemaReady;
}

export async function getContactSettings(): Promise<ContactSettings> {
  await ensureSchema();
  const result = await sql`SELECT data FROM contact_settings WHERE id = 1;`;
  return { ...defaultContactSettings, ...(result.rows[0]?.data ?? {}) };
}

export async function saveContactSettings(
  settings: ContactSettings,
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE contact_settings
    SET data = ${JSON.stringify(settings)}::jsonb, updated_at = now()
    WHERE id = 1;
  `;
}

export async function insertContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactMessage> {
  await ensureSchema();
  const result = await sql`
    INSERT INTO contact_messages (name, email, message)
    VALUES (${input.name}, ${input.email}, ${input.message})
    RETURNING id, name, email, message, created_at, replied, replied_at;
  `;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
    replied: row.replied,
    repliedAt: row.replied_at,
  };
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  await ensureSchema();
  const result = await sql`
    SELECT id, name, email, message, created_at, replied, replied_at FROM contact_messages ORDER BY created_at DESC;
  `;
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
    replied: row.replied,
    repliedAt: row.replied_at,
  }));
}

export async function deleteContactMessages(ids: number[]): Promise<number> {
  await ensureSchema();
  if (ids.length === 0) return 0;
  const result = await sql`
    DELETE FROM contact_messages WHERE id = ANY(${ids});
  `;
  return result.rowCount;
}

export async function markMessageReplied(id: number): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE contact_messages SET replied = true, replied_at = now() WHERE id = ${id};
  `;
}
