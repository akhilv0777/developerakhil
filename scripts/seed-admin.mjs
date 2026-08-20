// Run this once (locally or via `vercel env pull` + this script) to create
// or update the admin login stored in the database.
//
// Usage:
//   node scripts/seed-admin.mjs <username> <password>
//
// Requires POSTGRES_URL (or DATABASE_URL) to be set in the environment —
// either export it, or put it in a .env file in the project root (this
// script loads .env automatically).

import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

function resolveConnectionString() {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
  ].filter(Boolean);

  const usable = candidates.find((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'));
  if (usable) return usable;

  if (candidates.length > 0) {
    const protocols = candidates.map((url) => url.split('://')[0]).join(', ');
    console.error(`Found a database env var, but it uses an unsupported protocol (${protocols}).`);
    console.error('This script needs a plain "postgres://" or "postgresql://" connection string —');
    console.error('look for a "direct connection" / POSTGRES_URL style value in your provider\'s settings.');
    process.exit(1);
  }
  console.error('No database connection string found. Set POSTGRES_URL or DATABASE_URL.');
  console.error('(In Vercel: Project Settings → Storage → your Postgres DB → copy the .env.local snippet.)');
  process.exit(1);
}

async function main() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error('Usage: node scripts/seed-admin.mjs <username> <password>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const connectionString = resolveConnectionString();
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admin_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash;`,
    [username, passwordHash],
  );

  console.log(`✅ Admin user "${username}" is ready. You can now log in at /console.`);
  await pool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to seed admin user:', error);
  process.exit(1);
});
