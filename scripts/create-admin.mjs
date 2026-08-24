import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

async function run() {
  let url = process.env.DATABASE_URL;
  if (url.startsWith('prisma+postgres://')) {
    const urlObj = new URL(url);
    let apiKey = urlObj.searchParams.get("api_key");
    apiKey = apiKey.replace(/-/g, "+").replace(/_/g, "/");
    const pad = apiKey.length % 4;
    if (pad) apiKey += "=".repeat(4 - pad);
    const decoded = Buffer.from(apiKey, "base64").toString("utf8");
    url = JSON.parse(decoded).databaseUrl;
  }
  
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  
  const username = 'admin';
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  
  await pool.query(
    'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = $2',
    [username, hash]
  );
  
  console.log(`Created admin user: ${username} / ${password}`);
  process.exit(0);
}

run().catch(console.error);
