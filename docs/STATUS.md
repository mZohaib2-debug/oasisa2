# OasisA2 build status

Honest done / not-done. Updated as reality changes — do not mark something done
until it runs and is verified.

## ✅ Done and verified

### Environment
- Node + pnpm + Turborepo workspace; TS / Prettier / EditorConfig tooling
- PostgreSQL 16 running locally; `oasisa2` database created
- Initial Prisma migration applied

### `@oasisa2/database`
- Unified schema, 40 models covering every entity in the brief: users & profiles,
  addresses, stores + hours + delivery zones + fulfilment slots + notices,
  full catalog (department/category/subcategory/brand/product/variant/image/keyword),
  per-store price & inventory, butcher options & instructions, cart & items,
  favorites & saved lists, orders + items + status history, payments & refunds,
  promotions + coupons, notifications & device tokens, inventory adjustments,
  audit log.
- Money is `Int` cents everywhere. Weights are `Decimal` pounds.
- Prisma client singleton.
- **Seed** (idempotent): 2 branches with placeholder addresses/hours/zones,
  17 departments / 48 categories / ~200 subcategories, 10 demo brands,
  227 demo products (hero + generated filler, `isDemo: true`), per-store price &
  inventory for both branches (incl. a demo sale and a branch-specific
  out-of-stock), butcher option sets, 4 promotions, 3 coupons, 7 days of pickup
  + delivery slots per branch, staff users + a demo customer with favorites, a
  saved list and one completed order (for Buy Again).

### `@oasisa2/commerce` — pure business logic, **40 passing tests**
- `money` — integer-cents arithmetic, single-rounding multiply, basis-point
  discounts, formatting.
- `pricing` — store-resolved effective price, sale-window logic, % off, variant delta.
- `weighted` — estimate from requested lb; reprice from actual lb; large-drift
  re-confirmation flag; order never locked to estimate.
- `delivery` — ZIP normalisation, zone matching, branch/zone fee & minimum
  resolution, free-delivery threshold, minimum gate.
- `promotions` — line-level (%/amount/BOGO/fixed-price), one order-level promo,
  coupon evaluation (%/amount/free-delivery) with reason codes.
- `cart` — **authoritative totals**: gross → line promos → order promo →
  delivery fee → coupon → tax (taxable lines only, on net) → estimated total,
  plus delivery eligibility / minimum gating.
- `slots` — availability view, reservation guard, pure slot generator from store hours.
- `inventory` — available qty net of reservations, coarse-state derivation,
  reserve / release / finalize.
- `search` — South Asian synonym query expansion (atta→flour, keema→ground meat…).
- `orders` — order-number format, status state-machine, terminal detection.

### `@oasisa2/config`, `@oasisa2/types`, `@oasisa2/validation`
- Env validation (server/client split; Stripe/Clover "configured?" helpers).
- Branch placeholders, tax rates (placeholder), slot config, 60+ search synonyms.
- Shared enums + `ORDER_STATUS_FLOW` state machine + analytics event names.
- Zod schemas for store context, add/update cart, coupon, address, checkout,
  product filters, credentials, order-status update. No schema accepts money.

### `@oasisa2/api` — service layer (typechecks clean; integration tests pending an app)
- `store-context` — resolve store by slug, compute delivery quote.
- `catalog` — navigation tree, product listing with filters + sort + pagination,
  product detail (incl. butcher option groups + related), merchandising rails,
  search suggest (products / categories / brands).
- `cart` — find-or-create cart (user or anon), add/remove/set-qty, coupon,
  fully-priced `getCartView`.
- `orders` — `createOrderFromCart` (transactional: slot capacity + inventory
  reservation + address + order + payment record + cart conversion), list/get,
  `getBuyAgainItems`, `updateOrderStatus` (guarded transitions), `recordActualWeight`
  (butcher weight → line + order total recompute).

## 🚧 Not started / not done

| Area | State |
| --- | --- |
| **apps/web** (Next.js storefront) | not started — next priority |
| **apps/mobile** (Expo iOS/Android) | not started |
| **apps/admin** (Next.js ops) | not started |
| Auth (sessions, login, guest, Apple/Google) | schema + hashing in seed only; no runtime auth yet |
| Stripe payment intent + webhooks | models exist; no Stripe calls |
| Clover `POSProvider` boundary | not started |
| Picker workflow / Butcher queue UIs | service layer supports them; no UI |
| Notifications delivery (Expo/APNs/FCM) | models exist; no sender |
| Analytics event pipeline | event names defined; no emitter |
| SEO (sitemap, JSON-LD, `/locations/*`) | not started |
| Playwright E2E for the 7 customer flows | not started |
| CI workflow | `.github/workflows` dir exists, empty |

## Next 3 steps (recommended order)

1. **`apps/web` storefront** — Tailwind design system (emerald/cream/charcoal/gold),
   root layout + header (branch + pickup/delivery selector, search, cart, account),
   store-onboarding, home merchandising, department/category PLP, product detail
   with butcher + weighted flows, cart drawer/page, checkout (pickup/delivery/slot),
   `/api/*` route handlers wrapping `@oasisa2/api`. This makes the platform runnable
   end-to-end for a customer.
2. **Auth + account area** — session cookies, login/register/guest, order history,
   favorites, saved lists, Buy Again.
3. **`apps/admin`** — catalog, per-branch inventory & pricing, orders + status,
   promotions; then the picker/butcher handheld views.
