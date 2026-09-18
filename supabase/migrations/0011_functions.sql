-- Avas Thaa — 0011: functions
-- Anything that touches money or an audit-relevant state change lives
-- here as a single atomic function, called via Supabase RPC from a
-- Server Action — never computed in the client and written piecemeal.

-- ── Delivery pricing engine ────────────────────────────────────────────
-- Centralizes every fee component from admin-configurable tables; no
-- rate is ever hard-coded in a UI component. Distance fee uses PostGIS
-- great-circle distance between pickup/destination when coordinates are
-- available, else falls back to the island pair's flat distance_fee.
create or replace function calculate_delivery_fee(
  p_origin_island_id uuid,
  p_destination_island_id uuid,
  p_package_size package_size,
  p_delivery_type delivery_type,
  p_pickup_lat double precision default null,
  p_pickup_lng double precision default null,
  p_dest_lat double precision default null,
  p_dest_lng double precision default null
)
returns table (
  base_fee numeric, island_fee numeric, distance_fee numeric,
  package_size_fee numeric, express_fee numeric, scheduled_fee numeric,
  total_fee numeric
)
language plpgsql
stable
as $$
declare
  v_settings pricing_settings%rowtype;
  v_island_rate island_delivery_rates%rowtype;
  v_pkg_fee numeric := 0;
  v_distance_km double precision := 0;
  v_distance_fee numeric := 0;
  v_express numeric := 0;
  v_scheduled numeric := 0;
begin
  select * into v_settings from pricing_settings limit 1;

  select * into v_island_rate from island_delivery_rates
    where origin_island_id = p_origin_island_id
      and destination_island_id = p_destination_island_id
      and enabled = true;

  select fee into v_pkg_fee from package_size_fees where package_size = p_package_size;

  if p_pickup_lat is not null and p_dest_lat is not null then
    v_distance_km := ST_Distance(
      geography(ST_MakePoint(p_pickup_lng, p_pickup_lat)),
      geography(ST_MakePoint(p_dest_lng, p_dest_lat))
    ) / 1000.0;
    v_distance_fee := round((v_distance_km * v_settings.per_km_fee)::numeric, 2);
  elsif v_island_rate.id is not null then
    v_distance_fee := v_island_rate.distance_fee;
  end if;

  if p_delivery_type = 'express' then
    v_express := v_settings.express_fee;
  elsif p_delivery_type = 'scheduled' then
    v_scheduled := v_settings.scheduled_fee;
  end if;

  return query select
    v_settings.base_delivery_fee,
    coalesce(v_island_rate.base_fee, 0),
    v_distance_fee,
    coalesce(v_pkg_fee, 0),
    v_express,
    v_scheduled,
    v_settings.base_delivery_fee + coalesce(v_island_rate.base_fee, 0) + v_distance_fee
      + coalesce(v_pkg_fee, 0) + v_express + v_scheduled;
end;
$$;

-- ── Wallet ledger ───────────────────────────────────────────────────────
-- The only sanctioned way to move a wallet balance. Locks the wallet row
-- so concurrent debits/credits can't race past the non-negative check.
create or replace function adjust_wallet_balance(
  p_profile_id uuid,
  p_type wallet_txn_type,
  p_amount numeric,
  p_description text default null,
  p_reference_order_id uuid default null,
  p_reference_delivery_id uuid default null
)
returns wallet_transactions
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet wallets%rowtype;
  v_new_balance numeric;
  v_txn wallet_transactions%rowtype;
begin
  if p_amount <= 0 then
    raise exception 'Wallet adjustment amount must be positive; use the type to signal direction.';
  end if;

  select * into v_wallet from wallets where profile_id = p_profile_id for update;
  if not found then
    insert into wallets (profile_id) values (p_profile_id) returning * into v_wallet;
  end if;

  if p_type in ('debit') then
    v_new_balance := v_wallet.balance - p_amount;
    if v_new_balance < 0 then
      raise exception 'Insufficient wallet balance';
    end if;
  else
    v_new_balance := v_wallet.balance + p_amount;
  end if;

  update wallets set balance = v_new_balance where id = v_wallet.id;

  insert into wallet_transactions (
    wallet_id, type, amount, balance_after, reference_order_id, reference_delivery_id, description
  ) values (
    v_wallet.id, p_type, p_amount, v_new_balance, p_reference_order_id, p_reference_delivery_id, p_description
  ) returning * into v_txn;

  return v_txn;
end;
$$;

-- ── Partner commission split ────────────────────────────────────────────
create or replace function record_partner_earning(
  p_delivery_id uuid,
  p_customer_paid numeric
)
returns partner_earnings
language plpgsql
security definer set search_path = public
as $$
declare
  v_partner_id uuid;
  v_commission_pct numeric;
  v_commission numeric;
  v_partner_amount numeric;
  v_row partner_earnings%rowtype;
begin
  select assigned_partner_id into v_partner_id from deliveries where id = p_delivery_id;
  if v_partner_id is null then
    raise exception 'Delivery % has no assigned partner', p_delivery_id;
  end if;

  select platform_commission_percent into v_commission_pct from pricing_settings limit 1;
  v_commission := round(p_customer_paid * v_commission_pct / 100.0, 2);
  v_partner_amount := p_customer_paid - v_commission;

  insert into partner_earnings (partner_id, delivery_id, customer_paid, partner_amount, platform_commission)
  values (v_partner_id, p_delivery_id, p_customer_paid, v_partner_amount, v_commission)
  returning * into v_row;

  return v_row;
end;
$$;

-- ── Atomic checkout ──────────────────────────────────────────────────────
-- Snapshots cart_items -> order_items, computes totals server-side
-- (never trusts a client-supplied total), decrements product stock, and
-- clears the cart — all in one transaction.
create or replace function place_order(
  p_cart_id uuid,
  p_delivery_address_id uuid,
  p_delivery_method delivery_method,
  p_payment_method payment_method,
  p_contact_phone text,
  p_special_instructions text default null,
  p_coupon_code text default null,
  p_scheduled_for timestamptz default null
)
returns orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_cart carts%rowtype;
  v_item record;
  v_subtotal numeric := 0;
  v_delivery_fee numeric := 0;
  v_discount numeric := 0;
  v_coupon coupons%rowtype;
  v_order orders%rowtype;
  v_customer uuid := auth.uid();
begin
  select * into v_cart from carts where id = p_cart_id and profile_id = v_customer;
  if not found then
    raise exception 'Cart not found for current user';
  end if;

  select delivery_fee into v_delivery_fee from businesses where id = v_cart.business_id;

  select coalesce(sum(quantity * unit_price), 0) into v_subtotal
  from cart_items where cart_id = p_cart_id;

  if v_subtotal = 0 then
    raise exception 'Cannot place an order with an empty cart';
  end if;

  if p_coupon_code is not null then
    select * into v_coupon from coupons
      where code = p_coupon_code and active = true
        and now() between starts_at and expires_at
        and (business_id is null or business_id = v_cart.business_id)
        and v_subtotal >= minimum_order;
    if found then
      v_discount := case v_coupon.discount_type
        when 'percentage' then least(v_subtotal * v_coupon.discount_value / 100.0, coalesce(v_coupon.max_discount_amount, v_subtotal))
        else least(v_coupon.discount_value, v_subtotal)
      end;
    end if;
  end if;

  insert into orders (
    customer_id, business_id, delivery_method, delivery_address_id, scheduled_for,
    subtotal, delivery_fee, discount_amount, total_amount, coupon_id,
    payment_method, contact_phone, special_instructions
  ) values (
    v_customer, v_cart.business_id, p_delivery_method, p_delivery_address_id, p_scheduled_for,
    v_subtotal, v_delivery_fee, v_discount, v_subtotal + v_delivery_fee - v_discount,
    v_coupon.id, p_payment_method, p_contact_phone, p_special_instructions
  ) returning * into v_order;

  for v_item in select * from cart_items where cart_id = p_cart_id loop
    insert into order_items (
      order_id, menu_item_id, product_id, item_name, quantity, unit_price,
      selected_options, options_total, line_total, special_instructions
    )
    select
      v_order.id, v_item.menu_item_id, v_item.product_id,
      coalesce(mi.name, p.name), v_item.quantity, v_item.unit_price,
      v_item.selected_options,
      (select coalesce(sum((opt->>'price_delta')::numeric), 0) from jsonb_array_elements(v_item.selected_options) opt),
      v_item.quantity * (v_item.unit_price
        + (select coalesce(sum((opt->>'price_delta')::numeric), 0) from jsonb_array_elements(v_item.selected_options) opt)),
      v_item.special_instructions
    from (select 1) dummy
    left join menu_items mi on mi.id = v_item.menu_item_id
    left join products p on p.id = v_item.product_id;

    if v_item.product_id is not null then
      update products set stock_quantity = stock_quantity - v_item.quantity
        where id = v_item.product_id and stock_quantity >= v_item.quantity;
      if not found then
        raise exception 'Insufficient stock for product %', v_item.product_id;
      end if;
    end if;
  end loop;

  if p_coupon_code is not null and v_coupon.id is not null then
    insert into coupon_usage (coupon_id, profile_id, order_id, discount_applied)
    values (v_coupon.id, v_customer, v_order.id, v_discount);
  end if;

  delete from cart_items where cart_id = p_cart_id;
  delete from carts where id = p_cart_id;

  if p_payment_method = 'wallet' then
    perform adjust_wallet_balance(v_customer, 'debit', v_order.total_amount, 'Order ' || v_order.order_number, v_order.id);
  end if;

  insert into payments (order_id, profile_id, provider, amount, status, paid_at)
  values (v_order.id, v_customer, p_payment_method::text,
    v_order.total_amount,
    (case when p_payment_method = 'wallet' then 'paid' else 'pending' end)::payment_status,
    case when p_payment_method = 'wallet' then now() else null end);

  return v_order;
end;
$$;

-- ── State-machine guards ────────────────────────────────────────────────
-- Prevents impossible jumps (e.g. pending -> delivered) regardless of
-- which client/role issues the update; RLS governs *who*, this governs
-- *what transitions exist at all*.
create or replace function validate_order_status_transition()
returns trigger
language plpgsql
as $$
declare
  v_allowed jsonb := '{
    "pending": ["accepted", "rejected", "cancelled"],
    "accepted": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["assigned", "cancelled"],
    "assigned": ["picked_up", "cancelled"],
    "picked_up": ["in_transit"],
    "in_transit": ["delivered"],
    "delivered": [],
    "rejected": [],
    "cancelled": []
  }';
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (v_allowed -> old.status::text ? new.status::text) then
      raise exception 'Invalid order status transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_orders_validate_status_transition
  before update of status on orders
  for each row execute function validate_order_status_transition();

create or replace function validate_delivery_stage_transition()
returns trigger
language plpgsql
as $$
declare
  v_allowed jsonb := '{
    "awaiting_pickup": ["picked_up"],
    "picked_up": ["awaiting_boat", "out_for_delivery"],
    "awaiting_boat": ["in_transit_boat"],
    "in_transit_boat": ["arrived_destination"],
    "arrived_destination": ["out_for_delivery"],
    "out_for_delivery": ["delivered"],
    "delivered": []
  }';
begin
  if tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    if not (v_allowed -> old.stage::text ? new.stage::text) then
      raise exception 'Invalid delivery stage transition: % -> %', old.stage, new.stage;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_deliveries_validate_stage_transition
  before update of stage on deliveries
  for each row execute function validate_delivery_stage_transition();

-- Stop location writes the instant a delivery is marked delivered —
-- enforced at the DB layer, not just by the partner app no longer polling.
create or replace function guard_delivery_location_insert()
returns trigger
language plpgsql
as $$
declare
  v_stage delivery_stage;
begin
  select stage into v_stage from deliveries where id = new.delivery_id;
  if v_stage = 'delivered' then
    raise exception 'Cannot record location for a completed delivery';
  end if;
  return new;
end;
$$;
create trigger trg_delivery_locations_guard
  before insert on delivery_locations
  for each row execute function guard_delivery_location_insert();
