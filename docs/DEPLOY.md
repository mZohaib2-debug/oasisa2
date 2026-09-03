# Deploying OasisA2 (Vercel + Neon Postgres)

This is the "Option B" path: a permanent, always-on URL for the storefront (and the
admin dashboard) on free / low-cost tiers. It doubles as the production pipeline —
when you're ready to go live you add a domain and real Stripe keys, nothing else changes.

The repo is already prepared for this:

- `packages/database` runs `prisma generate` on install (`postinstall`) and has the
  Vercel/Lambda binary target baked into `schema.prisma`.
- `apps/web` and `apps/admin` `build` scripts are plain `next build` (they read env
  from the platform, not from a local `.env`). Use `pnpm --filter … build:local` to
  build locally against your `.env`.
- The storefront derives its public URL from `VERCEL_PROJECT_PRODUCTION_URL`
  automatically, so `NEXT_PUBLIC_SITE_URL` is optional.

---

## 1. Create the database (Neon)

1. Sign up at <https://neon.tech> (free tier is fine to start).
2. Create a project — name it `oasisa2`, Postgres 16, closest region.
3. From the project dashboard, copy **two** connection strings:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`
   - **Direct** (no `-pooler`) → this is `DIRECT_DATABASE_URL`
4. Add `?sslmode=require&pgbouncer=true&connection_limit=1` to the **pooled** URL if
   it isn't already there. Leave the direct URL with just `?sslmode=require`.

## 2. Load the schema + demo data into Neon

From your machine, run migrations and seed against Neon (one-time):

```bash
cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"

export DATABASE_URL='postgresql://…-pooler…/neondb?sslmode=require&pgbouncer=true&connection_limit=1'
export DIRECT_DATABASE_URL='postgresql://…(direct, no -pooler)…/neondb?sslmode=require'

pnpm --filter @oasisa2/database exec prisma migrate deploy
pnpm --filter @oasisa2/database exec tsx prisma/seed.ts

unset DATABASE_URL DIRECT_DATABASE_URL
```

## 3. Generate a production auth secret

```bash
openssl rand -base64 32
```

Keep this value — it goes in both Vercel projects as `AUTH_SECRET`. It must be
**different** from your local one.

## 4. Push the repo to GitHub

```bash
cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"
# create an empty repo at github.com/<you>/oasisa2 first (private is fine), then:
git remote add origin git@github.com:<you>/oasisa2.git
git push -u origin main
```

## 5. Create the Vercel projects

Do this twice — once for the storefront, once for the admin dashboard.

| Setting | Storefront | Admin |
| --- | --- | --- |
| Import | the `oasisa2` GitHub repo | same repo |
| **Root Directory** | `apps/web` | `apps/admin` |
| Framework preset | Next.js (auto) | Next.js (auto) |
| Build / Install / Output | leave as auto-detected | leave as auto-detected |
| Project name | `oasisa2-web` | `oasisa2-admin` |

> Vercel detects the pnpm workspace at the repo root and installs it; the
> `postinstall` in `packages/database` runs `prisma generate`. No custom commands needed.

### Environment variables (both projects, "Production" + "Preview")

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_DATABASE_URL` | Neon **direct** URL |
| `AUTH_SECRET` | the value from step 3 |

Storefront only, optional (only if you want a fixed canonical URL before adding a domain):

| `NEXT_PUBLIC_SITE_URL` | `https://oasisa2-web.vercel.app` |

Leave Stripe / Clover / Apple / Google variables unset — the code treats them as
"not configured".

### Deploy

Hit **Deploy** on each project. First build takes ~2–4 min. You'll get:

- `https://oasisa2-web.vercel.app` — the storefront (share this with the store owner)
- `https://oasisa2-admin.vercel.app` — the operations dashboard

Every `git push` to `main` redeploys both automatically.

## 6. Lock down the admin

The admin has its own staff login, but add a second gate so it's never publicly
browsable:

- Vercel → `oasisa2-admin` → Settings → Deployment Protection → **Vercel Authentication**
  (or Password Protection on Pro). Only people you invite can load it at all.

Then change the demo staff passwords: sign in to the admin as `admin@oasisa2.test`
→ Staff → set new passwords for each account. (Or run one SQL update against Neon.)

## 7. Before real launch (production checklist)

- [ ] Buy a domain, add it to `oasisa2-web` (root) and `oasisa2-admin` (subdomain)
- [ ] Store owner fills in the real address / phone / hours / delivery ZIPs / fees
      in the admin → Stores page (replaces the `TBD` placeholders)
- [ ] Store owner reviews / corrects the demo product prices
- [ ] Add live **Stripe** keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) + configure the webhook endpoint
- [ ] Move `DATABASE_URL` / `AUTH_SECRET` to Vercel's encrypted env (they already are)
      and rotate the Neon password
- [ ] Upgrade Vercel to **Pro** ($20/mo) — required for commercial use — and Neon to
      a paid tier when you outgrow the free compute hours
- [ ] Turn off demo data: the seed marks sample products `isDemo: true`; hide or
      delete them once the real catalog is entered

## Cost summary

| Stage | Vercel | Neon | Total |
| --- | --- | --- | --- |
| Owner review | Hobby (free) | Free | $0 |
| Production | Pro ($20/mo) | Launch (~$19/mo) | ~$40/mo + domain |

Alternatives if you'd rather one bill: Railway or Render can host both apps + Postgres
for roughly $15–25/mo total.
