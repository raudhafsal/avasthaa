# Avas Thaa

Local delivery and food-ordering PWA for Tha Atoll, Maldives.

## Status (as of this build)

**A live Supabase backend now exists** — project `avas-thaa`, all 14
migrations applied (46 tables, 116 RLS policies), reachable at the URL
and anon key already filled into `.env.local` in this zip. `npm install
&& npm run dev` connects to the real thing, not a placeholder.

**Done and verified** (schema exercised against a real Postgres+PostGIS
database *as a genuine non-superuser role* — see the RLS-testing note
under Architecture below — then pushed to the live project via
Supabase's migration tool; `tsc --noEmit`, `next lint`, and `next build`
all pass clean across all 29 routes):

- Full schema: profiles, islands, businesses (restaurants + shops —
  staff-managed, no owner login), catalog, cart/orders, delivery
  (boat stages, OTP handoff, live location), wallet/payments/payouts,
  coupons, reviews, notifications, support tickets, platform
  pricing/settings, admin audit log, and bank-transfer payments (see
  below) — every table has RLS, tested under real enforcement.
- Core DB functions: `calculate_delivery_fee()`, `adjust_wallet_balance()`
  (race-safe ledger), `record_partner_earning()` (commission split),
  `place_order()` (atomic checkout), plus state-machine guards so an
  order/delivery can't skip statuses.
- Auth: bilingual (English/Dhivehi, RTL-aware) phone-OTP register/login/
  verify with resend cooldown, email+password fallback with forgot/
  reset-password, profile setup (island + address), role-gated
  middleware for `/admin`, `/business`, `/partner`.
- Customer app: home (categories, nearby restaurants/shops), restaurant
  listing with filters, restaurant detail with menu + option groups +
  add-to-cart, multi-vendor cart (one active cart per business),
  checkout (cash / wallet / bank transfer) wired to `place_order()`,
  order confirmation + status timeline, orders list
  (active/completed/cancelled).
- **Bank transfer payments** — the only online-ish payment method for
  now, as requested. Checkout shows admin-configured bank details
  (`app_settings.bank_transfer_details` — currently empty, fill it in
  before launch); the customer uploads a slip (JPG/PNG/WEBP/PDF) to a
  private Storage bucket; staff review it in `/business/payments` and
  approve or reject with a note; a DB-level trigger physically prevents
  an order from being accepted into the kitchen until its bank transfer
  is verified, regardless of what the UI does.
- **Staff back-office** (`/business`) — restaurants and shops have no
  login of their own; any `staff` account manages every business.
  Dashboard (today's orders/sales/pending/active/payments-to-verify);
  business directory (create businesses directly, open/closed toggle,
  per-business menu/settings); unified order queue across every
  business with accept/reject (with reason)/preparing/ready — marking
  an order ready opens an unassigned delivery job with a generated
  handoff OTP; menu management; bank-transfer verification queue; a
  date-ranged aggregate sales report.
- **Delivery partner portal** (`/partner`) — onboarding (vehicle type +
  home island), online/offline toggle, available-jobs list scoped to
  the partner's island with race-safe accept (`WHERE assigned_partner_id
  IS NULL`, so two partners tapping the same job at once can't both get
  it), an active-delivery screen that walks through pickup → (boat
  stages, when required) → out-for-delivery → OTP-confirmed handoff,
  and an earnings screen (today/week/month/total, pending payout,
  payout history). **This portal's action code was not re-verified
  against a live non-superuser RLS session the way everything else in
  this list was** — it reuses already-tested patterns (the same claim
  guard, the same stage-transition trigger, the same earnings function)
  but the specific new code paths (`claimJob`, `advanceDeliveryStage`,
  `completeDeliveryWithOtp`) only passed `tsc`/`build`, not a full
  scripted walkthrough. Test this one by hand before relying on it.
- **Admin dashboard** (`/admin`) — platform-wide metrics (customers,
  businesses, partners, today's orders/sales, pending partner
  approvals, open support tickets); user search/filter with
  active/suspended/disabled status controls; business and partner
  approval controls (approve/reject/suspend); islands management
  (previously the *only* way to add an island was raw SQL — this closes
  that gap); pricing & commission settings (base/per-km/express/
  scheduled fees, platform commission %, package-size fees); coupon
  creation and activation toggle; a generic app-settings editor
  (this is also now how you fill in the bank transfer details, instead
  of raw SQL); and an audit log viewer. Every write here is logged to
  `admin_audit_logs`. Column names were cross-checked directly against
  the live schema via Supabase's own introspection — not just assumed
  from the migration files — but, like the partner portal, the write
  actions here were not walked through by hand against a live RLS
  session.

**One security note surfaced by Supabase's own advisory tooling while
verifying the live schema:** `public.spatial_ref_sys` (a PostGIS system
table of coordinate-reference-system definitions, auto-created by the
`postgis` extension — not application data) has RLS disabled and is
technically exposed to the anon/authenticated roles. It contains no
user or business data, but if you want it locked down:
```sql
alter table public.spatial_ref_sys enable row level security;
create policy spatial_ref_sys_select_all on public.spatial_ref_sys for select using (true);
```

**Not yet built:** shop/product browsing detail page and the
shop-product-management screen (schema and RLS already support both —
staff menu management follows the same pattern), customer wallet
screen, favorites, notifications list, support tickets, reviews UI, web
push, the seed script, and real app icons (still placeholders in
`public/icons/`).

## 1. Project setup

```bash
npm install
npm run dev   # .env.local already has real Supabase credentials — see below
```

## 2. Supabase project (already created and migrated)

A live project has already been created for you: **`avas-thaa`**
(ref `nfbweclllwesbzcckcoe`, region ap-southeast-1, in the "Hotel
Management" org), and all 14 migrations in `supabase/migrations/` have
been applied to it directly — you do **not** need to create a project
or run these migrations yourself. `.env.local` in this zip already has
its real URL and anon/publishable key filled in.

What's still manual, in the Supabase dashboard at supabase.com:
1. **Phone auth**: Authentication → Providers → Phone, plus an SMS
   provider (Twilio, MessageBird, etc.) for OTP delivery — this is the
   one thing that must be configured before registration/login work at
   all. Email auth is on by default for the password fallback.
2. **Storage buckets**: `payment-slips` (private) was created by the
   migrations. Still needed: a **public** bucket for business
   logos/covers/menu images, and a **private** bucket for partner
   ID/vehicle documents (never public — `partner_documents.file_path`
   assumes this).
3. **Service role key**: Project Settings → API → `service_role` —
   paste it into `.env.local`'s `SUPABASE_SERVICE_ROLE_KEY` (left blank
   in this zip on purpose; never commit it).
4. **Bank details**: fill in `app_settings.bank_transfer_details` (bank
   name, account name/number, instructions) — currently empty strings,
   and customers will see it blank at checkout until you do.

If you ever need to add more migrations yourself later, either use the
Supabase dashboard's SQL editor, or link the CLI:
```bash
supabase link --project-ref nfbweclllwesbzcckcoe
supabase db push
```

## 3. Environment variables

`.env.local` already exists in this zip with real values for the two
`NEXT_PUBLIC_SUPABASE_*` variables. What's still yours to fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ already set (`https://nfbweclllwesbzcckcoe.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ already set |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (server-only, never expose) — blank until you add it |
| `NEXT_PUBLIC_MAPS_API_KEY` | Optional — app works with address text if unset |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL once you have one (used in password-reset emails); `http://localhost:3000` for now |

Regenerate real TypeScript types from the live schema once you have the
Supabase CLI linked (see section 2):
```bash
npm run supabase:types
```
This replaces the loose placeholder in `types/database.ts` (documented
inline there) — after that, re-add the `<Database>` generic to the two
Supabase client factories in `lib/supabase/client.ts` and `server.ts`.

## 4. Local development

```bash
npm run dev        # http://localhost:3000
npm run type-check
npm run lint
npm run build
```

## 5. GitHub + Vercel deployment

1. Push this repo to GitHub.
2. Import it in Vercel, set the environment variables from step 3 in
   the Vercel project settings.
3. Deploy. Vercel's build servers have normal internet access, so
   `next/font/google` (Plus Jakarta Sans, Noto Sans Thaana) resolves
   fine there even though it can't be fetched from this sandboxed dev
   environment.

## 6. PWA installation

Once deployed, "Add to Home Screen" (iOS Safari) or the install prompt
(Android Chrome/desktop Chrome) installs Avas Thaa as a standalone app.
Replace the placeholder files in `public/icons/` with real 192×192,
512×512, and a maskable 512×512 PNG before shipping — the manifest
already points at these three files.

## 7. Admin and staff account creation

There's no seed script yet (see "Not yet built" above). To create the
first administrator and first staff member manually, after each has
signed up normally through the app:
```sql
update profiles set role = 'super_administrator' where phone = '+960XXXXXXX';
update profiles set role = 'staff' where phone = '+960YYYYYYY';
```
Remember: staff is the *only* role that can create/manage businesses
and their menus, and progress order status — restaurants and shops
never log in themselves (see Architecture notes below).

## 8. Production checklist

- [ ] Real app icons in `public/icons/`
- [ ] SMS provider configured for phone OTP
- [ ] Storage buckets created (public + private, as above)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set only in Vercel's server
      environment, never in a client-exposed variable
- [ ] Real generated `types/database.ts`, `<Database>` generic restored
      on both Supabase clients
- [ ] Legal page content filled in via `app_settings.legal_pages`
      (currently empty placeholders)
- [ ] Dhivehi translations in `lib/i18n/dictionaries.ts` reviewed by a
      native speaker — they were machine-drafted for this build and
      should be checked before shipping, especially punctuation and
      formal/informal register
- [ ] Payment gateway wired into the `payments` table's `provider`
      column if online payment (beyond cash/wallet) is needed
- [ ] `next build` run with real network access to confirm font
      fetching succeeds (it's sandbox-network-restricted in dev here,
      not a code issue — see commit history / build log)

## Architecture notes

- **Staff-managed catalog, not self-service.** Restaurants and shops
  don't get their own login or app. Any account with `role = 'staff'`
  can create and manage every business's menu/products and progress
  every order's status (accept → preparing → ready) — `businesses` has
  no owner/login concept at all, just an optional `created_by` for
  accountability. This is enforced by `is_staff()` in the RLS policies,
  not just hidden in the UI.
- **RLS was tested as a real non-superuser role, not just written.**
  Early in this build, every "RLS verified" claim was actually running
  as the Postgres superuser, which bypasses RLS entirely — so nothing
  was truly being checked. Once corrected (a real `authenticated` role
  with `SET ROLE`), testing surfaced three genuine bugs: an infinite
  recursion between `orders` and `deliveries` policies that referenced
  each other directly (fixed with a `security definer` helper function
  that breaks the cycle), a customer "cancel my order" policy whose
  implicit `WITH CHECK` made cancelling impossible, and a missing
  `deliveries` insert policy for staff. All three are fixed and
  re-verified end-to-end (order placement → staff progression → staff
  opens the delivery job → partner sees and claims it → both partner
  and staff can read the order's line items). If you extend the RLS
  policies further, test them the same way — as `SET ROLE authenticated`
  with `app.current_uid` set, never as `postgres`.
- **Multi-vendor cart model**: rather than one global cart, each
  customer can have one open cart *per business* (`carts` has a unique
  index on `(profile_id, business_id)`). This naturally prevents mixing
  items from different restaurants in a single order without needing
  a "clear cart to switch restaurants" confirmation flow — the cart
  page just lists each business's cart as its own card with its own
  checkout button.
- **Pricing is never hard-coded in the UI.** `calculate_delivery_fee()`
  reads `pricing_settings`, `island_delivery_rates`, and
  `package_size_fees` — an admin changes rates without a redeploy.
- **Money only moves through `adjust_wallet_balance()` and
  `place_order()`**, both `security definer` functions that lock rows
  and validate before writing, so there's no path for a client to write
  a wallet balance or order total directly (RLS blocks direct writes to
  `wallets`, and `orders.total_amount` is computed server-side inside
  `place_order()`).
