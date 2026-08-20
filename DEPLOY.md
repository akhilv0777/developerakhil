# Deploying to Vercel with a real admin login

The admin panel is no longer a public `/admin` link with browser-only
storage. It's now:

- A private URL: **`/console`** (not linked anywhere in the site nav)
- A real login form (username + password) checked against Postgres
- Content stored in a database, not `localStorage`

## 1. Push this project to a Git repo, then import it on Vercel

vercel.com → **Add New → Project** → import your repo.

## 2. Attach a Postgres database

Vercel's own Postgres product was retired — Postgres on Vercel now works
through Marketplace integrations (**Neon**, **Supabase**, or **Prisma
Postgres**, among others). In your Vercel project: **Storage → Create
Database → Postgres**, pick any provider, then connect it to this
project. This app works with all of them — it just needs a standard
`postgres://` connection string, which Vercel injects as `POSTGRES_URL`
(with `DATABASE_URL` as a fallback).

> **Using Prisma Postgres?** Its `DATABASE_URL` is a special
> `prisma+postgres://` proxy URL that only Prisma's own client
> understands. This project doesn't use Prisma — it reads `POSTGRES_URL`
> instead, which Prisma Postgres also provides as a normal
> `postgres://` connection string. No extra setup needed, just make sure
> `POSTGRES_URL` made it into your environment variables (it does by
> default).

## 3. Add a JWT secret

Project **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `JWT_SECRET` | any long random string, e.g. output of `openssl rand -base64 48` |

Add it for all three environments (Production, Preview, Development).

## 4. Deploy

Trigger a deploy (push to your repo, or click **Deploy** in Vercel).
The database tables are created automatically the first time the site
loads — you don't need to run any SQL by hand.

## 5. Create your admin login

You need to run this **once**, from your own computer, pointed at the
same database:

```bash
# pull the real POSTGRES_URL + JWT_SECRET into a local .env file
vercel env pull .env

# install deps if you haven't already
pnpm install

# create (or update) the admin account
pnpm seed:admin your-username "a-strong-password-here"
```

That's it — go to `https://your-site.vercel.app/console` and log in.

## Changing the login URL later

The path is just a normal route in `src/App.tsx` — search for
`path="/console"` in the `RouterContent` component and change it to
whatever you'd like (e.g. `/portal-x9k`). No other code needs to change.

## Local development

You need two processes running:

```bash
# terminal 1 — serves /api/* functions on :3000
vercel dev

# terminal 2 — serves the Vite frontend on :5173, proxying /api to :3000
pnpm dev
```

Then open `http://localhost:5173`. `vercel dev` will ask to link the
project and will pull the same env vars automatically.
