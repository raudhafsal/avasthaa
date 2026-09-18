-- Avas Thaa — 0009: pricing & platform settings
-- Singleton config tables so admins change rates/branding without a code
-- deploy; the pricing engine service (lib/services/pricing) reads these
-- plus island_delivery_rates/coupons — nothing is hard-coded in the UI.

create table pricing_settings (
  id boolean primary key default true check (id), -- enforces exactly one row
  base_delivery_fee numeric(10, 2) not null default 15,
  per_km_fee numeric(10, 2) not null default 3,
  express_fee numeric(10, 2) not null default 25,
  scheduled_fee numeric(10, 2) not null default 10,
  platform_commission_percent numeric(5, 2) not null default 20,
  default_minimum_order numeric(10, 2) not null default 0,
  updated_at timestamptz not null default now()
);
insert into pricing_settings (id) values (true);
create trigger trg_pricing_settings_updated_at before update on pricing_settings
  for each row execute function set_updated_at();

create table package_size_fees (
  package_size package_size primary key,
  fee numeric(10, 2) not null default 0
);
insert into package_size_fees (package_size, fee) values
  ('small', 0), ('medium', 10), ('large', 25), ('custom', 0);

-- Free-form, admin-editable platform config: app name/logo, support
-- contact, default language/currency, legal-page bodies, feature toggles.
-- Deliberately key/value so new settings never require a migration.
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);
create trigger trg_app_settings_updated_at before update on app_settings
  for each row execute function set_updated_at();

insert into app_settings (key, value) values
  ('app_name', '"Avas Thaa"'),
  ('currency', '"MVR"'),
  ('default_language', '"dv"'),
  ('support_phone', '""'),
  ('support_email', '""'),
  ('address_labels', '["home", "work", "other"]'),
  ('legal_pages', '{"privacy_policy": "", "terms": "", "delivery_policy": "", "refund_policy": "", "cancellation_policy": "", "partner_terms": ""}');

create table admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id),
  action text not null, -- e.g. 'order.status_change', 'business.approve', 'refund.issue'
  entity_type text not null,
  entity_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
