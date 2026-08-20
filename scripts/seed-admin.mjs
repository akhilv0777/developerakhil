// Run this once (locally or via `vercel env pull` + this script) to create
// or update the admin login stored in the database.
//
// Usage:
//   node scripts/seed-admin.mjs <username> <password>
//
// Requires DATABASE_URL to be set in the environment — either export it,
// or put it in a .env file in the project root (this script loads .env
// automatically).

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

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
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Add it to a .env file or export it in your shell.');
    console.error('(In Vercel: Project Settings → Storage → your Postgres DB → copy the .env.local snippet.)');
    process.exit(1);
  }
  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  const passwordHash = await bcrypt.hash(password, 12);

  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username)
    DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `;

  console.log(`✅ Admin user "${username}" is ready. You can now log in at /console.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to seed admin user:', error);
  process.exit(1);
});
