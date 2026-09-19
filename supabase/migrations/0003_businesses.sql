-- Avas Thaa — 0003: businesses (restaurants & shops share one table; the
-- `business_type` enum + boolean flags distinguish behavior, so listing,
-- search, and ordering logic stays multi-vendor-generic rather than
-- forking into two parallel schemas.)

create table business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_dhivehi text not null,
  icon text, -- emoji or icon key, admin-editable
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  -- No self-service owner account: restaurants/shops don't log in.
  -- created_by/managed_by just record which staff member is responsible,
  -- for accountability — never an authorization boundary (any staff can
  -- manage any business; see is_staff() in 0012).
  created_by uuid references profiles(id),
  business_type business_type not null,
  category_id uuid references business_categories(id),
  name text not null,
  name_dhivehi text,
  description text,
  description_dhivehi text,
  logo_url text,
  cover_image_url text,
  phone text not null,
  island_id uuid not null references islands(id),
  address text not null,
  latitude double precision,
  longitude double precision,
  delivery_fee numeric(10, 2) not null default 0,
  minimum_order numeric(10, 2) not null default 0,
  estimated_prep_minutes int not null default 20,
  is_open boolean not null default true, -- manual override; business_hours governs the schedule
  is_featured boolean not null default false,
  rating_average numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  -- Staff-created businesses go live immediately; approval_status is kept
  -- for admin-side suspension/rejection, not a signup gate anymore.
  approval_status approval_status not null default 'approved',
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_businesses_updated_at before update on businesses
  for each row execute function set_updated_at();

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  opens_at time not null,
  closes_at time not null,
  closed boolean not null default false,
  unique (business_id, day_of_week)
);

-- Restaurant menu categories are per-restaurant (e.g. "Popular", "Burgers"),
-- distinct from the platform-wide business_categories above.
create table restaurant_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  name_dhivehi text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  name_dhivehi text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
