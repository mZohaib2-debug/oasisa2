# OasisA2 build status

Honest done / not-done. Updated as reality changes.

**Runnable now:** `pnpm --filter @oasisa2/web dev` (storefront, :3000) ·
`pnpm --filter @oasisa2/admin dev` (operations, :3001). Both build clean.

## ✅ Done and verified

### Environment
- Node + pnpm + Turborepo workspace; TS / Prettier / EditorConfig tooling
- PostgreSQL 16 running locally; migrations applied
- `pnpm --filter @oasisa2/web build` passes (23 routes); `pnpm test` → 43 passing

### `@oasisa2/database`
- Unified 40-model schema; money = `Int` cents; weights = `Decimal` lb
- Prisma client singleton
- Idempotent seed: 2 branches (placeholder address/hours/zones), 17 departments /
  48 categories / ~200 subcategories, 10 brands, 227 demo products, per-store
  price & inventory (incl. demo sales + a branch-specific out-of-stock), butcher
  option sets, 4 promotions, 3 coupons, 7 days of pickup + delivery slots,
  staff + a demo customer with favorites / a saved list / one completed order

### `@oasisa2/commerce` — pure logic, 40 tests
money · pricing (sale windows, % off, variant delta) · weighted items (estimate ↔
actual-weight reprice, drift re-confirm) · delivery eligibility (ZIP/zone/fee/min/
free-threshold) · promotions & coupons · **authoritative cart totals** · slots ·
inventory reservation · search synonym expansion · order status state-machine

### `@oasisa2/config` / `types` / `validation`
env validation · branch placeholders · tax/slot constants · 60+ search synonyms ·
shared enums + `ORDER_STATUS_FLOW` · Zod request schemas (no money accepted from clients)

### `@oasisa2/api` — service layer
store-context (+ delivery quote) · catalog (nav tree, filtered/sorted/paginated
listing, detail with butcher groups, rails, search suggest) · slots · promotions ·
cart (find-or-create guest/user, mutate, coupon, priced view) · orders
(transactional checkout: slot capacity + inventory reservation + address + order +
payment record + cart conversion; list/get; Buy Again; guarded status transitions;
butcher actual-weight → order total recompute)

### `apps/web` — customer storefront (Next.js 15 App Router) ✅ runnable end-to-end
- Design system: emerald / cream / charcoal / gold; responsive; skip-link; a11y labels
- **Store onboarding + header switcher**: pickup/delivery + branch + ZIP eligibility,
  persisted in a cookie; guest carts (signed anon-id) and signed-in carts (session cookie)
- **Home**: hero, weekly-specials banners, Buy Again (repeat customers), department
  rails, shop-by-department, butcher / produce / pantry / new-arrivals rails
- **Browse**: all-departments, department PLP, category PLP with subcategory chips,
  filter toggles (in-stock / on-sale / halal), sort, pagination
- **Product detail**: variant picker, weighted approximate-weight picker + live
  estimate, **full butcher workflow** (cut / piece size / bone / thickness / skin /
  fat + special instructions), related products, Product JSON-LD
- **Search**: results page + type-ahead suggestions, South Asian synonym expansion
  (atta→flour, keema→ground meat, lal mirch→red chili…)
- **Cart**: server-priced lines, qty/remove, coupon, butcher + substitution display,
  weighted-estimate messaging, order summary
- **Checkout**: contact, delivery address, pickup/delivery **slot picker**, tip,
  notes, **guest checkout** + optional account creation; transactional order
  creation; confirmation page
- **Account**: overview, order history + Buy Again + one-tap reorder, order detail
  (butcher info, actual vs estimated weight, status history), favorites, saved
  lists ("add all to cart"), login / register
- **Mobile**: native-style bottom tab bar, mobile store switcher, tested at 375px
- **/api** routes for the future mobile app: `/api/search`, `/api/delivery`,
  `/api/cart`, `/api/store-context`
- **SEO**: metadata + OpenGraph, Product + GroceryStore JSON-LD, `sitemap.xml`,
  `robots.txt`, `/locations/glen-burnie` + `/locations/fredericksburg`

Verified in a browser: onboarding → shop → weighted goat + butcher options →
cart → checkout → order `OA2-100001` created, slot reserved 1/12, confirmation renders.

### `apps/admin` — staff operations dashboard (Next.js 15) ✅ runnable
- Role-gated staff auth (ADMIN / STORE_MANAGER / PICKER / BUTCHER); per-branch
  store scope switcher; every mutation writes an `AuditLog` row
- **Dashboard**: 30-day revenue / AOV / orders / open-orders / low-stock KPIs,
  revenue sparkline, pick & butcher queue counts, top products, recent orders,
  staff activity feed
- **Orders**: filterable list (status / fulfilment / search / date), detail with
  items + butcher instructions + customer + address + slot + payment, **guarded
  status transitions** (`assertTransition`) with timeline, **printable pick sheet**
- **Picking queue**: per-order item checklist — Picked / Substitute (+note) /
  Not available / Send to butcher; order auto-advances when all items resolve
- **Butcher queue**: cut/bone/instructions + actual-weight entry →
  `recordActualWeight` recomputes the line and order final total
  (verified: OA2-100001 est 3 lb → actual 3.25 lb → $29.97 → $32.47)
- **Catalog**: product list with per-branch price & stock; product editor
  (details, per-branch price + sale, inventory adjust with reason codes,
  temporary hold); create product; brands
- **Inventory**: low/out-of-stock report, absolute-quantity adjustments (audited)
- **Promotions & coupons**: list, activate/deactivate, create (percent / amount /
  BOGO / fixed price; order / product / category / department scope; per-store)
- **Stores**: edit address / phone / hours / prep times / delivery fee-min-free
  threshold (**unlocks the TBD placeholders**), delivery-zone CRUD, store notices,
  regenerate time slots from hours
- **Time slots**: per-day view, open/close individual slots
- **Customers** list, **Staff** management (ADMIN only), **Reports**
- Inventory reservations are finalised on `PACKED` and released on `CANCELLED`
  inside a transaction

## 🚧 Not done yet

| Area | State |
| --- | --- |
| **apps/mobile** (Expo iOS/Android) | not started — `/api` surface is ready |
| **Stripe** payment intent + webhooks | `Payment` records created as `REQUIRES_PAYMENT`; no charge |
| **Clover `POSProvider`** boundary | not started |
| **Notifications** delivery (Expo/APNs/FCM) | models exist; no sender |
| **Analytics** event pipeline | event names defined; no emitter |
| **Driver app** | schema-ready; no app |
| OAuth (Apple / Google sign-in) | email/password only |
| Playwright E2E, CI workflow | not started |
| Butcher-option editing in admin | shipped via seed; read-only in admin |

## Recommended next steps

1. **apps/mobile** — Expo app against the `/api` routes; reuse `@oasisa2/commerce`
   + `@oasisa2/types` directly. Bottom nav: Home / Browse / Search / Orders / Cart.
2. **Stripe** — wire `createPaymentIntent` + webhook to move `Payment` →
   `CAPTURED` and confirm the order; add Apple Pay / Google Pay on mobile.
3. **Notifications** — an Expo push sender keyed off `OrderStatusHistory` inserts.
4. **Clover `POSProvider`** — provider interface with a `mock` implementation.
