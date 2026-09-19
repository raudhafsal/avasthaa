-- Avas Thaa — 0006: delivery
-- `deliveries` covers all three delivery kinds (food order, shop order,
-- standalone parcel) in one table: an order-linked delivery has order_id
-- set and pickup/destination copied from the order+business at creation;
-- a standalone parcel has order_id null and every field filled by the
-- customer directly. This keeps partner-facing job matching, tracking,
-- and earnings uniform regardless of what's being carried.

create table delivery_partners (
  id uuid primary key references profiles(id) on delete cascade,
  vehicle_type vehicle_type not null,
  vehicle_registration text,
  island_id uuid not null references islands(id), -- home base island
  is_online boolean not null default false,
  current_latitude double precision,
  current_longitude double precision,
  approval_status approval_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  rating_average numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_delivery_partners_updated_at before update on delivery_partners
  for each row execute function set_updated_at();

-- ID/vehicle documents kept out of any public bucket; access governed by
-- storage policy + RLS below (partner sees own, admin sees all).
create table partner_documents (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references delivery_partners(id) on delete cascade,
  document_type text not null, -- 'national_id' | 'drivers_license' | 'vehicle_registration' | other
  file_path text not null, -- private storage path, not a public URL
  verified boolean not null default false,
  uploaded_at timestamptz not null default now()
);

create table island_delivery_rates (
  id uuid primary key default gen_random_uuid(),
  origin_island_id uuid not null references islands(id),
  destination_island_id uuid not null references islands(id),
  base_fee numeric(10, 2) not null default 0,
  distance_fee numeric(10, 2) not null default 0,
  requires_boat boolean not null default false,
  enabled boolean not null default true,
  unique (origin_island_id, destination_island_id)
);

-- Coarser routing config: which island *pairs* even support delivery at
-- all and by what transport, independent of the fee amount above.
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  origin_island_id uuid not null references islands(id),
  destination_island_id uuid not null references islands(id),
  supports_boat boolean not null default false,
  enabled boolean not null default true,
  unique (origin_island_id, destination_island_id)
);

create table scheduled_delivery_slots (
  id uuid primary key default gen_random_uuid(),
  island_id uuid references islands(id), -- null = applies platform-wide
  day_of_week int check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  max_bookings int, -- null = unlimited
  enabled boolean not null default true
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  kind delivery_kind not null,
  order_id uuid references orders(id), -- null for standalone parcels
  customer_id uuid not null references profiles(id),
  delivery_type delivery_type not null default 'standard',
  stage delivery_stage not null default 'awaiting_pickup',

  pickup_island_id uuid not null references islands(id),
  pickup_address text not null,
  pickup_contact_name text not null,
  pickup_phone text not null,
  pickup_latitude double precision,
  pickup_longitude double precision,

  destination_island_id uuid not null references islands(id),
  destination_address text not null,
  recipient_name text not null,
  recipient_phone text not null,
  destination_latitude double precision,
  destination_longitude double precision,

  package_description text,
  package_size package_size not null default 'small',
  package_quantity int not null default 1,
  special_instructions text,

  scheduled_time timestamptz, -- required when delivery_type = 'scheduled'
  requires_boat boolean not null default false,

  assigned_partner_id uuid references delivery_partners(id),
  assigned_at timestamptz,

  delivery_otp text, -- shown to customer, entered by partner at handoff
  otp_verified_at timestamptz,

  base_fee numeric(10, 2) not null default 0,
  island_fee numeric(10, 2) not null default 0,
  distance_fee numeric(10, 2) not null default 0,
  package_size_fee numeric(10, 2) not null default 0,
  express_fee numeric(10, 2) not null default 0,
  scheduled_fee numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  total_fee numeric(10, 2) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_deliveries_updated_at before update on deliveries
  for each row execute function set_updated_at();

create table delivery_stage_history (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  stage delivery_stage not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create or replace function log_delivery_stage_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') or (new.stage is distinct from old.stage) then
    insert into delivery_stage_history (delivery_id, stage, changed_by)
    values (new.id, new.stage, auth.uid());
  end if;
  return new;
end;
$$;
create trigger trg_deliveries_stage_history
  after insert or update of stage on deliveries
  for each row execute function log_delivery_stage_change();

-- Live GPS pings while a delivery is active. App stops writing once the
-- delivery reaches 'delivered' — see the pruning function in 0011.
create table delivery_locations (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  partner_id uuid not null references delivery_partners(id),
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  recorded_at timestamptz not null default now()
);
