-- Avas Thaa — 0008: favorites, reviews, notifications, support

create table favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  business_id uuid references businesses(id),
  product_id uuid references products(id),
  menu_item_id uuid references menu_items(id),
  created_at timestamptz not null default now(),
  check (
    num_nonnulls(business_id, product_id, menu_item_id) = 1
  )
);
create unique index uq_favorite_business on favorites (profile_id, business_id) where business_id is not null;
create unique index uq_favorite_product on favorites (profile_id, product_id) where product_id is not null;
create unique index uq_favorite_menu_item on favorites (profile_id, menu_item_id) where menu_item_id is not null;

create table reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  order_id uuid not null references orders(id),
  business_id uuid references businesses(id),
  menu_item_id uuid references menu_items(id),
  product_id uuid references products(id),
  delivery_id uuid references deliveries(id),
  partner_id uuid references delivery_partners(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  -- one review row is either about the business/item or about the
  -- delivery partner for that order — never both in the same row
  check (
    (business_id is not null or menu_item_id is not null or product_id is not null)
    != (partner_id is not null)
  )
);
-- Prevent duplicate reviews of the same target from the same order.
create unique index uq_review_business_per_order on reviews (order_id, business_id) where business_id is not null;
create unique index uq_review_partner_per_order on reviews (order_id, partner_id) where partner_id is not null;

create or replace function refresh_business_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update businesses set
    rating_average = (select coalesce(avg(rating), 0) from reviews where business_id = coalesce(new.business_id, old.business_id)),
    rating_count = (select count(*) from reviews where business_id = coalesce(new.business_id, old.business_id))
  where id = coalesce(new.business_id, old.business_id);
  return coalesce(new, old);
end;
$$;
-- (No WHEN clause: DELETE triggers can't reference NEW, and the function
-- itself already coalesces new/old and no-ops harmlessly when both are null.)
create trigger trg_reviews_refresh_business_rating
  after insert or update or delete on reviews
  for each row execute function refresh_business_rating();

create or replace function refresh_partner_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update delivery_partners set
    rating_average = (select coalesce(avg(rating), 0) from reviews where partner_id = coalesce(new.partner_id, old.partner_id)),
    rating_count = (select count(*) from reviews where partner_id = coalesce(new.partner_id, old.partner_id))
  where id = coalesce(new.partner_id, old.partner_id);
  return coalesce(new, old);
end;
$$;
create trigger trg_reviews_refresh_partner_rating
  after insert or update or delete on reviews
  for each row execute function refresh_partner_rating();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  title_dhivehi text,
  body text not null,
  body_dhivehi text,
  channel notification_channel not null default 'in_app',
  category text not null, -- 'order_update' | 'delivery_update' | 'promotion' | 'support' | 'admin'
  reference_order_id uuid references orders(id),
  reference_delivery_id uuid references deliveries(id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  category text not null, -- 'order' | 'delivery' | 'payment' | 'complaint' | 'other'
  subject text not null,
  status ticket_status not null default 'open',
  related_order_id uuid references orders(id),
  related_delivery_id uuid references deliveries(id),
  assigned_staff_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_support_tickets_updated_at before update on support_tickets
  for each row execute function set_updated_at();

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  message text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);
