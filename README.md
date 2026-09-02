# OasisA2 Commerce Platform

One shared commerce backend for **OasisA2 Supermarket** (Glen Burnie & Fredericksburg
branches) powering the customer website, iOS app, Android app, admin dashboard, and
in-store picker / butcher workflows. Halal-focused South Asian & Middle Eastern grocery.

> **Status:** the shared data + commerce layer, the **customer web storefront**, and
> the **staff operations dashboard** (orders, picking, butcher queue, catalog,
> inventory, pricing, promotions, store config, reports) are complete and runnable
> end-to-end. The mobile app and live Stripe/Clover are not built yet.
> See [`docs/STATUS.md`](docs/STATUS.md) for the exact done / not-done breakdown.

### Demo staff logins (admin, http://localhost:3001)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@oasisa2.test` | `password123` |
| Store manager | `manager.gb@oasisa2.test` | `password123` |
| Picker | `picker.gb@oasisa2.test` | `password123` |
| Butcher | `butcher.gb@oasisa2.test` | `password123` |

---

## Architecture

Monorepo (pnpm workspaces + Turborepo). **One PostgreSQL database. One catalog.
One cart/order model.** Web, mobile and admin all talk to the same backend.

```
oasisa2/
  apps/
    web/      Next.js 15 customer storefront          ✅ built & runnable (:3000)
    admin/    Next.js 15 operations dashboard         ✅ built & runnable (:3001)
    mobile/   Expo / React Native iOS + Android      (planned — /api surface ready)
  packages/
    database/    Prisma schema + client + seed  (PostgreSQL, integer-cents money)
    config/      env validation, branch placeholders, tax/slot constants, search synonyms
    types/       shared enums, order-status state machine, analytics event names
    commerce/    PURE business logic — money, pricing, weighted items, delivery
                 eligibility, promotions/coupons, cart totals, slots, inventory
                 reservation, order lifecycle  (40 unit tests)
    validation/  Zod request schemas (no client ever submits price/discount/total)
    api/         data-access + services: store context, catalog, cart, orders,
                 buy-again, picker/butcher weight capture
```

### Money & correctness rules (enforced, not aspirational)

- **All money is integer US cents.** No floating point. `packages/commerce/src/money.ts`
  is the only place rounding happens.
- **Totals are always recomputed server-side** from `StorePrice` + active
  `Promotion`s + fee rules. The client submits item ids and quantities — never money.
- **Per-branch everything:** price, inventory, hours, delivery zones, fees,
  minimums, slots and promotions are all per `Store`.
- **Weighted meat** is priced as an *estimate* from the customer's requested
  pounds; the butcher records the actual prepared weight and the line + order
  total are repriced. The order is never locked to the estimate.
- **Inventory** is reserved inside a DB transaction at checkout to prevent
  overselling; reservations convert to decrements on fulfilment.

---

## Prerequisites

- Node.js ≥ 20 (repo pins 20.11 in `.nvmrc`; developed against a newer runtime too)
- pnpm ≥ 9 — `npm i -g pnpm`
- PostgreSQL ≥ 14 running locally (or a connection string to one)

## Setup

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL + AUTH_SECRET at minimum
pnpm db:generate              # generate the Prisma client
pnpm db:migrate               # apply migrations
pnpm db:seed                  # load demo catalog (2 stores, 200+ demo products)
```

`.env` needs, at minimum:

```
DATABASE_URL="postgresql://USER:PASS@localhost:5432/oasisa2?schema=public"
DIRECT_DATABASE_URL="postgresql://USER:PASS@localhost:5432/oasisa2?schema=public"
AUTH_SECRET="<openssl rand -base64 32>"
```

Everything else in `.env.example` (Stripe, Clover, Apple/Google sign-in, push) is a
**placeholder** — the code runs without them and treats those integrations as
"not configured" / "mock".

### Demo logins (after seeding)

| Role     | Email                     | Password      |
| -------- | ------------------------- | ------------- |
| Admin    | `admin@oasisa2.test`      | `password123` |
| Manager  | `manager.gb@oasisa2.test` | `password123` |
| Picker   | `picker.gb@oasisa2.test`  | `password123` |
| Butcher  | `butcher.gb@oasisa2.test` | `password123` |
| Customer | `customer@oasisa2.test`   | `password123` |

Demo coupons: `WELCOME10`, `FREEDELIVERY`, `EID5`.

---

## Commands

```bash
pnpm dev          # run app dev servers (web on http://localhost:3000)
pnpm --filter @oasisa2/web dev   # just the storefront
pnpm build        # turbo build
pnpm lint         # eslint across the workspace
pnpm typecheck    # tsc --noEmit across every package
pnpm test         # vitest across every package
pnpm format       # prettier --write

pnpm db:studio    # Prisma Studio
pnpm db:reset     # drop + re-migrate + re-seed  (destructive)
```

---

## Business-data placeholders

Real store addresses, phone numbers, hours, delivery ZIP codes, delivery fees and
minimums are **not invented**. They ship as clearly-labelled `TBD` placeholders in
`packages/config/src/stores.ts` and on the seeded `Store` / `DeliveryZone` /
`StoreHours` rows, and are meant to be edited by OasisA2 staff in the admin
dashboard. Demo product prices are illustrative sample data (`isDemo: true`), not
real OasisA2 prices.

## Payments (Stripe)

Architecture is wired (`Payment` / `Refund` models, per-order payment intent,
idempotency key, webhook-ready). With no `STRIPE_SECRET_KEY` set, checkout creates
the order with a `REQUIRES_PAYMENT` payment record and does not claim a charge
occurred.

## Clover POS integration

A provider boundary (`POSProvider`) is planned so core commerce logic never couples
to Clover. Until real credentials + API access exist, `CLOVER_ENVIRONMENT=mock` and
no live sync happens. Do not describe Clover sync as live until then.
