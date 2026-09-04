# OasisA2 — Full Deployment Guide

This takes the platform from "runs on my Mac" to **two live URLs on the internet**:

- `https://oasisa2-web.vercel.app` — the customer storefront (share this with the store owner)
- `https://oasisa2-admin.vercel.app` — the staff operations dashboard

Everything here is free-tier. Total hands-on time ≈ 20–30 minutes.

---

## How the pieces fit together

| Piece | What it is | What it holds |
| --- | --- | --- |
| **Neon** | A hosted PostgreSQL database | All the data: products, orders, customers, prices, inventory |
| **GitHub** | Where your code lives online | The whole `oasisa2` repo |
| **Vercel** | The web host | Runs `apps/web` and `apps/admin`, rebuilds them whenever you push to GitHub |

Flow: **you push code to GitHub → Vercel notices → Vercel builds the app → the app talks to Neon → visitors see the site.**

You create **two** Vercel projects from the **one** GitHub repo because it's a
monorepo — one project builds the `apps/web` folder, the other builds `apps/admin`.
They share the same database.

**The Neon database already exists.** Its schema (40 tables) is already applied.
It just needs the demo data loaded (Phase 1).

---

## Prerequisites

You need accounts on:

1. **GitHub** — <https://github.com/signup> (free)
2. **Vercel** — <https://vercel.com/signup> — **sign up with your GitHub account**, it makes the rest easier
3. **Neon** — already set up (`lostsolutionsinmind@gmail.com`)

On your Mac you already have Node, pnpm, and git. You'll also install the GitHub CLI in Phase 2.

---

## Phase 1 — Load the demo data into Neon

The database has tables but no rows. This one command fills it with the 2 branches,
17 departments, 227 demo products, prices, inventory, promotions, time slots, and
the demo staff/customer accounts.

1. Open Terminal.
2. Get the current connection string: go to <https://console.neon.tech> → project
   **oasisa2** → **Connect** button (top right) → copy the connection string shown.
   It looks like `postgresql://neondb_owner:npg_XXXX@ep-misty-breeze-au0r9hah-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   — the `npg_XXXX` part is the password.
3. Build the **direct** URL: take that string and **delete `-pooler`** from the host.
4. Run (paste your real URL — keep the single quotes):

   ```bash
   cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"

   # the DIRECT url (host WITHOUT -pooler):
   export DATABASE_URL='postgresql://neondb_owner:npg_XXXX@ep-misty-breeze-au0r9hah.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
   export DIRECT_DATABASE_URL="$DATABASE_URL"

   pnpm --filter @oasisa2/database exec tsx prisma/seed.ts

   unset DATABASE_URL DIRECT_DATABASE_URL
   ```

5. Success looks like:

   ```
   Seeding OasisA2 demo data ...
     stores: 2
     departments: 17, categories: 48
     brands: 10
     products: 227
     promotions: 4, coupons: 3
     fulfillment slots: 120
     staff + demo customer + 1 completed order
   Done. Demo logins use password: password123
   ```

If it says **"Authentication failed"** the password was rotated — repeat step 2 for a
fresh one. If it says **"Can't reach database server"**, wait 30 seconds (the Neon
compute was asleep) and run the `pnpm … seed.ts` line again.

---

## Phase 2 — Put the code on GitHub

### 2a. Install and sign in to the GitHub CLI (easiest way to authenticate)

```bash
brew install gh
gh auth login
```

Answer the prompts:
- **What account?** → `GitHub.com`
- **Preferred protocol?** → `HTTPS`
- **Authenticate Git with your GitHub credentials?** → `Yes`
- **How would you like to authenticate?** → `Login with a web browser`
- It shows a one-time code, press Enter, your browser opens → paste the code → Authorize.

### 2b. Create the repo and push everything

```bash
cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"
git add -A
git commit -m "Deploy: OasisA2 platform" --allow-empty
gh repo create oasisa2 --private --source=. --remote=origin --push
```

This creates `github.com/<you>/oasisa2` (private), links it, and pushes `main`.
Your `.env` file is **not** pushed — it's in `.gitignore`, so the database password
stays off GitHub.

Confirm: `gh repo view --web` opens the repo in your browser. You should see the
`apps/`, `packages/`, `prisma/` folders.

---

## Phase 3 — Deploy the storefront on Vercel

### 3a. Sign in

Go to <https://vercel.com> and sign in **with GitHub**. If it's your first time,
Vercel asks to install its GitHub app — allow it for the `oasisa2` repo (or all repos).

### 3b. Import the project

1. Vercel dashboard → **Add New…** → **Project**.
2. Find **oasisa2** in the list → **Import**.
3. **Configure Project** screen:
   - **Project Name:** `oasisa2-web`
   - **Framework Preset:** should auto-say **Next.js**. If not, pick it.
   - **Root Directory:** click **Edit** → choose **`apps/web`** → **Continue**.
     *(This is the important one — it tells Vercel to build the storefront folder.)*
   - **Build & Output Settings:** leave everything on the defaults / "Override" off.
     Vercel detects the pnpm workspace and handles it.

### 3c. Add environment variables

Still on the Configure screen, expand **Environment Variables**. Add these three
(name on the left, value on the right), then click **Add** after each:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the **pooled** Neon URL (host **with** `-pooler`) + `&pgbouncer=true&connection_limit=1` on the end |
| `DIRECT_DATABASE_URL` | the **direct** Neon URL (host **without** `-pooler`) |
| `AUTH_SECRET` | a fresh secret — run `openssl rand -base64 32` in Terminal and paste the output |

By default a variable applies to Production, Preview, and Development — leave that.

> Example `DATABASE_URL`:
> `postgresql://neondb_owner:npg_XXXX@ep-misty-breeze-au0r9hah-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=1`

### 3d. Deploy

Click **Deploy**. The build runs for 2–4 minutes. When it's green, click the
screenshot / **Visit** → you should see the OasisA2 storefront with the
"Welcome to OasisA2 / choose pickup or delivery" screen.

**Save your `AUTH_SECRET`** somewhere — you'll paste the *same value* into the admin project.

---

## Phase 4 — Deploy the admin dashboard

Same repo, second project.

1. Vercel dashboard → **Add New…** → **Project** → **Import** `oasisa2` again.
2. Configure:
   - **Project Name:** `oasisa2-admin`
   - **Root Directory:** **Edit** → **`apps/admin`** → Continue
3. **Environment Variables:** add the **same three** as the storefront —
   `DATABASE_URL`, `DIRECT_DATABASE_URL`, and the **exact same** `AUTH_SECRET` value
   you used for the storefront (this matters — sessions are signed with it).
4. **Deploy.**
5. When green, Visit → you should see the OasisA2 staff **Sign in** page.
   Log in with `admin@oasisa2.test` / `password123`.

---

## Phase 5 — Verify both apps

**Storefront** (`oasisa2-web.vercel.app`):
- [ ] Onboarding screen appears; pick **Pickup** + **Glen Burnie** → Start shopping
- [ ] Home page shows product rails with prices
- [ ] Open a product (e.g. "Halal Goat — Curry Cut"), choose weight + butcher options, **Add to cart**
- [ ] Cart shows the item; **Checkout** → pick a time slot → **Place order** → confirmation page

**Admin** (`oasisa2-admin.vercel.app`):
- [ ] Sign in as `admin@oasisa2.test` / `password123`
- [ ] Dashboard shows KPIs and the order you just placed
- [ ] **Orders** → open the order → **Mark Confirmed**

If a page shows a 500 error, jump to Troubleshooting.

---

## Phase 6 — Secure the admin (do this before sharing anything)

1. **Add a second lock on the admin URL.** Vercel → `oasisa2-admin` → **Settings**
   → **Deployment Protection** → turn on **Vercel Authentication** →
   "Standard Protection". Now only people you invite to the Vercel project can even
   load the admin site. (Free plan includes this.)

2. **Change the demo passwords.** In the admin, sign in as `admin@oasisa2.test` →
   **Staff** → for each account (admin, manager, picker, butcher), set a real
   password in the "Add / update staff" form (enter their email + name + a new
   password → Save).

3. **Rotate the database password** once everything works: Neon console → project
   → **Roles** → `neondb_owner` → **Reset password** → then update
   `DATABASE_URL` + `DIRECT_DATABASE_URL` in **both** Vercel projects → redeploy.

---

## Phase 7 — Share with the store owner

Send the owner just the storefront URL: **`https://oasisa2-web.vercel.app`**.

Tell them:
- It's a working prototype with **demo products and demo prices** — review the
  *design and the ordering flow*, not the specific items/prices.
- Store address, phone, hours, delivery ZIPs and fees are **placeholders** and get
  filled in from the admin dashboard.

If they should also see the admin, add them as a member: Vercel →
`oasisa2-admin` → **Settings → Members** (or share your screen for a walkthrough).

---

## How updates work from now on

Any time you (or Claude) change the code:

```bash
cd "/Users/muhammadzohaib/Desktop/GROCERY STORE"
git add -A
git commit -m "what changed"
git push
```

Vercel automatically rebuilds and redeploys **both** apps within ~3 minutes. No
other action needed.

If you change the **database schema** (`schema.prisma`), also run the migration
against Neon once, from your Mac:

```bash
export DATABASE_URL='<direct Neon URL>'
export DIRECT_DATABASE_URL="$DATABASE_URL"
pnpm --filter @oasisa2/database exec prisma migrate deploy
unset DATABASE_URL DIRECT_DATABASE_URL
```

---

## Troubleshooting

**Seed: "Authentication failed against database server"**
The Neon password changed. Get a fresh connection string from the Neon console
(**Connect** button) and re-run Phase 1.

**Seed or build: "Can't reach database server … :5432"**
Neon's compute auto-sleeps when idle and takes a few seconds to wake. Just run the
command again. If it persists, check the URL has `?sslmode=require`.

**`gh auth login` / `git push`: "Authentication failed"**
Run `gh auth login` again and choose "Login with a web browser". Then
`git push -u origin main`.

**Vercel build fails: "Cannot find module '@oasisa2/…'"**
Vercel → project → **Settings → Build & Development Settings** → turn ON
**"Include files outside of the root directory in the build step"** → redeploy.

**Vercel build fails during "prisma generate" or "Collecting page data"**
Usually the env vars aren't set for the environment being built. Vercel → project →
**Settings → Environment Variables** → confirm all three exist and are ticked for
**Production**. Then **Deployments → … → Redeploy**.

**Live site loads but every page is a 500 error**
Same cause — missing/incorrect `DATABASE_URL` at runtime. Check the exact value
(pooled host, has `pgbouncer=true`). Redeploy after fixing.

**Admin: "Invalid staff credentials" with the right password**
The seed didn't run (no `admin@oasisa2.test` user yet) — do Phase 1. If the seed
ran, the `AUTH_SECRET` differs between what you think and what's set — it doesn't
affect login validity, so this is almost always the seed.

**Admin: logged in, then immediately bounced back to sign-in**
`AUTH_SECRET` is different between the two Vercel projects, or was changed after
you logged in. Set the **same** value on both, redeploy, sign in again.

**Storefront onboarding modal won't go away**
It writes a cookie on submit; if cookies are blocked in that browser it loops.
Try a normal (non-incognito) window.

---

## When you're ready for real launch

- [ ] Buy a domain; add it in Vercel → `oasisa2-web` → Settings → Domains
      (root domain), and a subdomain like `admin.yourdomain.com` for the admin
- [ ] Store owner enters real address / phone / hours / delivery ZIPs / fees in
      **admin → Stores** (replaces every `TBD`)
- [ ] Store owner reviews and corrects prices; hide the `isDemo` sample products
- [ ] Add live **Stripe** keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) as Vercel env vars + set the webhook URL
- [ ] Upgrade Vercel to **Pro** ($20/mo — required for commercial use)
- [ ] Move Neon to a paid tier when free compute hours run low (~$19/mo)
- [ ] Turn off Vercel Authentication on the storefront if you'd added it (keep it on admin)

**Rough monthly cost at launch:** ~$40 (Vercel Pro + Neon) + domain (~$12/yr).
