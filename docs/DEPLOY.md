# Deploying OasisA2 (Vercel + Neon Postgres)

Permanent, always-on URLs for the storefront and the admin dashboard. Free / low-cost
tiers. Same pipeline becomes production later (add a domain + Stripe keys).

The repo is already prepared for this:

- `packages/database` runs `prisma generate` on install and has the Vercel/Lambda
  binary target in `schema.prisma`.
- `apps/web` / `apps/admin` `build` = plain `next build` (env comes from the platform).
  `build:local` keeps `.env` for local use.
- The storefront derives its public URL from `VERCEL_PROJECT_PRODUCTION_URL`, so
  `NEXT_PUBLIC_SITE_URL` is optional.

> **A Neon project already exists** for this repo: `oasisa2` (`morning-breeze-73135922`,
> AWS us-east-1, Postgres 16, free plan). Get its connection strings from
> <https://console.neon.tech> → project **oasisa2** → **Connect**, or ask Claude to
> re-print them. You need the **pooled** string (host has `-pooler`) and the
> **direct** string (no `-pooler`).

---

## 1. Load the schema + demo data into Neon (from your Mac — one time)

```bash
cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"

export DATABASE_URL='<<POOLED string>>&pgbouncer=true&connection_limit=1'
export DIRECT_DATABASE_URL='<<DIRECT string (no -pooler)>>'

pnpm --filter @oasisa2/database exec prisma migrate deploy
pnpm --filter @oasisa2/database exec tsx prisma/seed.ts

unset DATABASE_URL DIRECT_DATABASE_URL
```

Expect: `2 stores`, `17 departments`, `227 products`, `120 slots`, staff + demo customer.

## 2. Fresh production auth secret

```bash
openssl rand -base64 32
```

Save it — goes in both Vercel projects as `AUTH_SECRET` (must differ from local).

## 3. Push to GitHub

```bash
cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"
# create an empty repo at github.com/<you>/oasisa2 (Private), then:
git remote add origin https://github.com/<you>/oasisa2.git
git push -u origin main
```

## 4. Two Vercel projects (dashboard: "Add New… → Project" → import the repo)

Import the repo twice.

| Setting | Storefront | Admin |
| --- | --- | --- |
| **Root Directory** | `apps/web` | `apps/admin` |
| Framework | Next.js (auto) | Next.js (auto) |
| Build / Install / Output | leave auto | leave auto |
| Project name | `oasisa2-web` | `oasisa2-admin` |

**Environment Variables** (add to *Production* and *Preview* on **both** projects):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** string + `&pgbouncer=true&connection_limit=1` |
| `DIRECT_DATABASE_URL` | Neon **direct** string |
| `AUTH_SECRET` | value from step 2 |

Leave Stripe / Clover / Apple / Google unset. Hit **Deploy** on each (~2–4 min).

Result:
- `https://oasisa2-web.vercel.app` — storefront (share with the store owner)
- `https://oasisa2-admin.vercel.app` — operations dashboard

Every `git push` to `main` redeploys both.

## 5. Lock down + clean up

- Vercel → `oasisa2-admin` → Settings → **Deployment Protection** → enable
  **Vercel Authentication** (only people you invite can even load it).
- Sign in to the admin as `admin@oasisa2.test` / `password123` → **Staff** → set real
  passwords for every account.

## 6. Before real launch

- [ ] Domain → `oasisa2-web` (root) + `oasisa2-admin` (subdomain)
- [ ] Store owner fills real address / phone / hours / delivery ZIPs / fees in
      admin → **Stores** (replaces the `TBD` placeholders)
- [ ] Store owner reviews / corrects demo prices; hide `isDemo` products
- [ ] Live **Stripe** keys + webhook
- [ ] Rotate the Neon password; Vercel env is already encrypted
- [ ] Vercel **Pro** ($20/mo, required for commercial use); Neon paid tier when you
      outgrow free compute hours

## Cost

| Stage | Vercel | Neon | Total |
| --- | --- | --- | --- |
| Owner review | Hobby (free) | Free | $0 |
| Production | Pro ($20/mo) | ~$19/mo | ~$40/mo + domain |

One-bill alternative: Railway or Render (~$15–25/mo for both apps + Postgres).
