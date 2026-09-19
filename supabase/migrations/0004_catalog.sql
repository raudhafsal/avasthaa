-- Avas Thaa — 0004: catalog
-- menu_items = restaurant food; products = shop goods (stock-tracked).
-- Kept as separate tables since their fields genuinely diverge (prep time
-- and add-ons vs. stock/SKU), but both hang off `businesses` uniformly.

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid references restaurant_categories(id),
  name text not null,
  name_dhivehi text,
  description text,
  description_dhivehi text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  available boolean not null default true,
  preparation_time_minutes int not null default 15,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_menu_items_updated_at before update on menu_items
  for each row execute function set_updated_at();

-- A variation group, e.g. "Size" with choices Small/Medium/Large, or an
-- add-on group like "Extras" where multiple choices can be selected.
create table menu_item_option_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  name text not null, -- e.g. "Size", "Add-ons"
  name_dhivehi text,
  selection_type text not null default 'single' check (selection_type in ('single', 'multiple')),
  is_required boolean not null default false,
  min_select int not null default 0,
  max_select int, -- null = unlimited
  sort_order int not null default 0
);

create table menu_item_options (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references menu_item_option_groups(id) on delete cascade,
  name text not null, -- e.g. "Extra cheese"
  name_dhivehi text,
  price_delta numeric(10, 2) not null default 0, -- e.g. +20.00
  available boolean not null default true,
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid references product_categories(id),
  name text not null,
  name_dhivehi text,
  description text,
  description_dhivehi text,
  price numeric(10, 2) not null check (price >= 0),
  sale_price numeric(10, 2) check (sale_price is null or sale_price >= 0),
  image_url text,
  sku text,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5,
  is_featured boolean not null default false,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

-- Derived, read-only in the app (never write directly): drives "Out of
-- stock" / "Low stock" badges from stock_quantity + low_stock_threshold.
create or replace view product_stock_status as
select
  id as product_id,
  case
    when stock_quantity <= 0 then 'out_of_stock'
    when stock_quantity <= low_stock_threshold then 'low_stock'
    else 'in_stock'
  end as stock_status
from products;
