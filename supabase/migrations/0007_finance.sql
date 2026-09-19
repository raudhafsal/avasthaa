-- Avas Thaa — 0007: finance
-- Every balance-affecting write goes through the functions in 0011
-- (adjust_wallet_balance, record_partner_earning, ...) rather than the
-- app writing balances directly, so the ledger tables below are always
-- the reconciling source of truth.

create table wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_wallets_updated_at before update on wallets
  for each row execute function set_updated_at();

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  type wallet_txn_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  balance_after numeric(12, 2) not null,
  reference_order_id uuid references orders(id),
  reference_delivery_id uuid references deliveries(id),
  description text,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  delivery_id uuid references deliveries(id),
  profile_id uuid not null references profiles(id),
  provider text not null default 'cash', -- 'cash' | 'wallet' | a configured online provider key
  provider_reference text, -- external gateway transaction id, once configured
  amount numeric(12, 2) not null check (amount >= 0),
  status payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_id is not null or delivery_id is not null)
);
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  amount numeric(12, 2) not null check (amount > 0),
  reason text not null,
  processed_by uuid references profiles(id),
  processed_at timestamptz not null default now()
);

create table partner_earnings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references delivery_partners(id),
  delivery_id uuid not null references deliveries(id),
  customer_paid numeric(10, 2) not null,
  partner_amount numeric(10, 2) not null,
  platform_commission numeric(10, 2) not null,
  payout_id uuid, -- set once included in a payout batch (FK below)
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references delivery_partners(id),
  amount numeric(12, 2) not null check (amount > 0),
  period_start date not null,
  period_end date not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  processed_by uuid references profiles(id),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table partner_earnings
  add constraint fk_partner_earnings_payout foreign key (payout_id) references payouts(id);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type discount_type not null,
  discount_value numeric(10, 2) not null check (discount_value > 0),
  minimum_order numeric(10, 2) not null default 0,
  max_discount_amount numeric(10, 2), -- caps a percentage discount
  business_id uuid references businesses(id), -- null = platform-wide
  category_id uuid references business_categories(id), -- null = any category
  island_id uuid references islands(id), -- null = any island
  usage_limit int, -- total redemptions, null = unlimited
  usage_limit_per_user int not null default 1,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id),
  profile_id uuid not null references profiles(id),
  order_id uuid not null references orders(id),
  discount_applied numeric(10, 2) not null,
  used_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

alter table orders
  add constraint fk_orders_coupon foreign key (coupon_id) references coupons(id);
