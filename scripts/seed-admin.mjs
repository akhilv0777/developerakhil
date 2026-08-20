// Run this once (locally or via `vercel env pull` + this script) to create
// or update the admin login stored in the database.
//
// Usage:
//   node scripts/seed-admin.mjs <username> <password>

import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;
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
    process.exit(1);
  }

  // Neon ki jagah ab standard pg Client use hoga
  const client = new Client({
    connectionString: connectionString,
  });

  await client.connect();

  try {
    // Table create karne ka standard query
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const passwordHash = await bcrypt.hash(password, 12);

    // Data insert ya update karne ka query
    await client.query(`
      INSERT INTO admin_users (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username)
      DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, [username, passwordHash]);

    console.log(`✅ Admin user "${username}" is ready. You can now log in at /console.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed admin user:', error);
  process.exit(1);
});