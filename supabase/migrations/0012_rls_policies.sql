-- Avas Thaa — 0012: Row Level Security
-- Every table below gets RLS enabled with no default-open policy: a row
-- is visible/writable only through a rule that names who and why.
-- Helper functions are `security definer` so they can read `profiles`
-- for the current user without RLS on `profiles` recursively blocking
-- itself, and `stable` so the planner can reuse the result within a query.

create or replace function current_role_name()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('administrator', 'super_administrator')
      and account_status = 'active'
  );
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'staff'
      and account_status = 'active'
  );
$$;

create or replace function is_partner_for_delivery(p_delivery_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from deliveries where id = p_delivery_id and assigned_partner_id = auth.uid()
  );
$$;

-- Runs as this function's owner (bypassing RLS on `deliveries` entirely
-- for its internal query), specifically so that orders_select_partner
-- below never evaluates deliveries' own RLS policies as the calling
-- role. Without this indirection, orders_select_partner's subquery into
-- deliveries and deliveries_select_business's subquery into orders form
-- a two-table cycle: Postgres reports "infinite recursion detected in
-- policy for relation orders" the moment both sides are plain subqueries.
create or replace function is_partner_for_order(p_order_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from deliveries where order_id = p_order_id and assigned_partner_id = auth.uid()
  );
$$;

-- Prevents anyone but an admin from elevating their own role or
-- reactivating a suspended account through a normal profile update.
create or replace function guard_profile_privileged_fields()
returns trigger
language plpgsql
as $$
begin
  if not is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change a user role';
    end if;
    if new.account_status is distinct from old.account_status then
      raise exception 'Only an administrator can change account status';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_profiles_guard_privileged
  before update on profiles
  for each row execute function guard_profile_privileged_fields();

-- ── profiles ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy profiles_select_self on profiles for select
  using (id = auth.uid());
create policy profiles_select_admin on profiles for select
  using (is_admin());
-- Staff can see any customer's contact details for orders they're
-- handling (any staff manages any business); a delivery partner sees the
-- customer for a delivery assigned to them specifically.
create policy profiles_select_counterparty on profiles for select
  using (
    exists (
      select 1 from orders o
      where o.customer_id = profiles.id and is_staff()
    )
    or exists (
      select 1 from deliveries d
      where d.customer_id = profiles.id and d.assigned_partner_id = auth.uid()
    )
  );
create policy profiles_update_self on profiles for update
  using (id = auth.uid());
create policy profiles_update_admin on profiles for update
  using (is_admin());

-- ── islands ──────────────────────────────────────────────────────────────
alter table islands enable row level security;
create policy islands_select_all on islands for select using (true);
create policy islands_write_admin on islands for insert with check (is_admin());
create policy islands_update_admin on islands for update using (is_admin());
create policy islands_delete_admin on islands for delete using (is_admin());

-- ── addresses ────────────────────────────────────────────────────────────
alter table addresses enable row level security;
create policy addresses_owner_all on addresses for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy addresses_admin_select on addresses for select using (is_admin());

-- ── business_categories (platform-wide, admin-managed) ───────────────────
alter table business_categories enable row level security;
create policy business_categories_select_all on business_categories for select using (true);
create policy business_categories_write_admin on business_categories for all
  using (is_admin()) with check (is_admin());

-- ── businesses ───────────────────────────────────────────────────────────
-- No owner-account concept: any active staff (or admin) can create and
-- manage any business record. Customers only ever see approved ones.
alter table businesses enable row level security;
create policy businesses_select_public on businesses for select
  using (approval_status = 'approved');
create policy businesses_select_staff on businesses for select
  using (is_staff() or is_admin());
create policy businesses_insert_staff on businesses for insert
  with check (is_staff() or is_admin());
create policy businesses_update_staff on businesses for update
  using (is_staff() or is_admin());
create policy businesses_delete_admin on businesses for delete using (is_admin());

-- ── business_hours / restaurant_categories / product_categories ─────────
alter table business_hours enable row level security;
create policy business_hours_select on business_hours for select
  using (exists (select 1 from businesses b where b.id = business_id and b.approval_status = 'approved') or is_staff() or is_admin());
create policy business_hours_write on business_hours for all
  using (is_staff() or is_admin()) with check (is_staff() or is_admin());

alter table restaurant_categories enable row level security;
create policy restaurant_categories_select on restaurant_categories for select
  using (exists (select 1 from businesses b where b.id = business_id and b.approval_status = 'approved') or is_staff() or is_admin());
create policy restaurant_categories_write on restaurant_categories for all
  using (is_staff() or is_admin()) with check (is_staff() or is_admin());

alter table product_categories enable row level security;
create policy product_categories_select on product_categories for select
  using (exists (select 1 from businesses b where b.id = business_id and b.approval_status = 'approved') or is_staff() or is_admin());
create policy product_categories_write on product_categories for all
  using (is_staff() or is_admin()) with check (is_staff() or is_admin());

-- ── menu_items / options ──────────────────────────────────────────────────
alter table menu_items enable row level security;
create policy menu_items_select on menu_items for select
  using (exists (select 1 from businesses b where b.id = business_id and b.approval_status = 'approved') or is_staff() or is_admin());
create policy menu_items_write on menu_items for all
  using (is_staff() or is_admin()) with check (is_staff() or is_admin());

alter table menu_item_option_groups enable row level security;
create policy menu_item_option_groups_select on menu_item_option_groups for select
  using (exists (
    select 1 from menu_items mi join businesses b on b.id = mi.business_id
    where mi.id = menu_item_id and (b.approval_status = 'approved' or is_staff() or is_admin())
  ));
create policy menu_item_option_groups_write on menu_item_option_groups for all
  using (exists (select 1 from menu_items mi where mi.id = menu_item_id and (is_staff() or is_admin())))
  with check (exists (select 1 from menu_items mi where mi.id = menu_item_id and (is_staff() or is_admin())));

alter table menu_item_options enable row level security;
create policy menu_item_options_select on menu_item_options for select
  using (exists (
    select 1 from menu_item_option_groups g join menu_items mi on mi.id = g.menu_item_id join businesses b on b.id = mi.business_id
    where g.id = option_group_id and (b.approval_status = 'approved' or is_staff() or is_admin())
  ));
create policy menu_item_options_write on menu_item_options for all
  using (exists (
    select 1 from menu_item_option_groups g join menu_items mi on mi.id = g.menu_item_id
    where g.id = option_group_id and (is_staff() or is_admin())
  ))
  with check (exists (
    select 1 from menu_item_option_groups g join menu_items mi on mi.id = g.menu_item_id
    where g.id = option_group_id and (is_staff() or is_admin())
  ));

-- ── products ─────────────────────────────────────────────────────────────
alter table products enable row level security;
create policy products_select on products for select
  using (exists (select 1 from businesses b where b.id = business_id and b.approval_status = 'approved') or is_staff() or is_admin());
create policy products_write on products for all
  using (is_staff() or is_admin()) with check (is_staff() or is_admin());

-- ── carts / cart_items ───────────────────────────────────────────────────
alter table carts enable row level security;
create policy carts_owner_all on carts for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table cart_items enable row level security;
create policy cart_items_owner_all on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.profile_id = auth.uid()));

-- ── orders ───────────────────────────────────────────────────────────────
alter table orders enable row level security;
create policy orders_select_customer on orders for select using (customer_id = auth.uid());
create policy orders_select_business on orders for select using (is_staff());
create policy orders_select_partner on orders for select
  using (is_partner_for_order(id));
create policy orders_select_admin on orders for select using (is_admin());
create policy orders_insert_customer on orders for insert with check (customer_id = auth.uid());
create policy orders_update_business on orders for update using (is_staff());
-- WITH CHECK is deliberately narrower than USING: a customer may only
-- move their own pending order to 'cancelled' — without this explicit
-- clause, Postgres defaults WITH CHECK to the USING expression, which
-- would require the row to STILL be 'pending' after the update and
-- make cancelling impossible (caught by testing, not by inspection).
create policy orders_update_customer_cancel on orders for update
  using (customer_id = auth.uid() and status = 'pending')
  with check (customer_id = auth.uid() and status = 'cancelled');
create policy orders_update_admin on orders for update using (is_admin());

-- ── order_items (read-only to clients; written only by place_order()) ────
alter table order_items enable row level security;
create policy order_items_select on order_items for select
  using (exists (
    select 1 from orders o where o.id = order_id
      and (o.customer_id = auth.uid() or is_staff() or is_admin() or is_partner_for_order(o.id))
  ));

-- ── order_status_history (read-only; trigger-populated) ──────────────────
alter table order_status_history enable row level security;
create policy order_status_history_select on order_status_history for select
  using (exists (
    select 1 from orders o where o.id = order_id
      and (o.customer_id = auth.uid() or is_staff() or is_admin() or is_partner_for_order(o.id))
  ));

-- ── delivery_partners ────────────────────────────────────────────────────
alter table delivery_partners enable row level security;
create policy delivery_partners_select_self on delivery_partners for select using (id = auth.uid());
create policy delivery_partners_select_admin on delivery_partners for select using (is_admin());
-- A business/customer with a live delivery needs to see the partner's
-- public status (name comes via the profiles counterparty policy above).
create policy delivery_partners_select_counterparty on delivery_partners for select
  using (exists (
    select 1 from deliveries d where d.assigned_partner_id = delivery_partners.id
      and (d.customer_id = auth.uid() or is_staff())
  ));
create policy delivery_partners_insert_self on delivery_partners for insert with check (id = auth.uid());
create policy delivery_partners_update_self on delivery_partners for update using (id = auth.uid());
create policy delivery_partners_update_admin on delivery_partners for update using (is_admin());

alter table partner_documents enable row level security;
create policy partner_documents_owner on partner_documents for all
  using (partner_id = auth.uid()) with check (partner_id = auth.uid());
create policy partner_documents_admin on partner_documents for select using (is_admin());

-- ── island_delivery_rates / delivery_zones / scheduled_delivery_slots ────
alter table island_delivery_rates enable row level security;
create policy island_delivery_rates_select on island_delivery_rates for select using (true);
create policy island_delivery_rates_write on island_delivery_rates for all
  using (is_admin()) with check (is_admin());

alter table delivery_zones enable row level security;
create policy delivery_zones_select on delivery_zones for select using (true);
create policy delivery_zones_write on delivery_zones for all
  using (is_admin()) with check (is_admin());

alter table scheduled_delivery_slots enable row level security;
create policy scheduled_delivery_slots_select on scheduled_delivery_slots for select using (true);
create policy scheduled_delivery_slots_write on scheduled_delivery_slots for all
  using (is_admin()) with check (is_admin());

-- ── deliveries ───────────────────────────────────────────────────────────
alter table deliveries enable row level security;
create policy deliveries_select_customer on deliveries for select using (customer_id = auth.uid());
create policy deliveries_select_partner on deliveries for select using (assigned_partner_id = auth.uid());
-- Unassigned jobs must be visible to *available* partners so they can be
-- offered/accepted; assigned ones stay scoped to the assignee above.
create policy deliveries_select_available_to_partners on deliveries for select
  using (assigned_partner_id is null and current_role_name() = 'delivery_partner');
create policy deliveries_select_business on deliveries for select
  using (is_staff() and order_id is not null);
create policy deliveries_select_admin on deliveries for select using (is_admin());
create policy deliveries_insert_customer on deliveries for insert with check (customer_id = auth.uid());
-- Staff open the delivery job when marking a food/shop order ready
-- (see markReady() in the app) — the row's customer_id is the order's
-- actual customer, not the staff member, so this can't reuse the
-- customer policy's check.
create policy deliveries_insert_staff on deliveries for insert with check (is_staff());
create policy deliveries_insert_admin on deliveries for insert with check (is_admin());
create policy deliveries_update_partner_assigned on deliveries for update using (assigned_partner_id = auth.uid());
-- Accepting a job: an available partner may claim any currently
-- unassigned delivery (assigns themselves); can't reassign someone else's.
create policy deliveries_update_partner_claim on deliveries for update
  using (assigned_partner_id is null and current_role_name() = 'delivery_partner');
create policy deliveries_update_admin on deliveries for update using (is_admin());

alter table delivery_stage_history enable row level security;
create policy delivery_stage_history_select on delivery_stage_history for select
  using (exists (
    select 1 from deliveries d where d.id = delivery_id
      and (d.customer_id = auth.uid() or d.assigned_partner_id = auth.uid() or is_admin() or is_staff())
  ));

alter table delivery_locations enable row level security;
create policy delivery_locations_insert_partner on delivery_locations for insert
  with check (partner_id = auth.uid() and is_partner_for_delivery(delivery_id));
create policy delivery_locations_select on delivery_locations for select
  using (exists (
    select 1 from deliveries d where d.id = delivery_id
      and (d.customer_id = auth.uid() or d.assigned_partner_id = auth.uid() or is_admin() or is_staff())
  ));

-- ── wallets / wallet_transactions ─────────────────────────────────────────
alter table wallets enable row level security;
create policy wallets_select_self on wallets for select using (profile_id = auth.uid());
create policy wallets_select_admin on wallets for select using (is_admin());
-- No client insert/update policy: balances change only via
-- adjust_wallet_balance() (security definer), never a direct client write.

alter table wallet_transactions enable row level security;
create policy wallet_transactions_select_self on wallet_transactions for select
  using (exists (select 1 from wallets w where w.id = wallet_id and w.profile_id = auth.uid()));
create policy wallet_transactions_select_admin on wallet_transactions for select using (is_admin());

-- ── payments / refunds ────────────────────────────────────────────────────
alter table payments enable row level security;
create policy payments_select_self on payments for select using (profile_id = auth.uid());
create policy payments_select_staff on payments for select using (is_staff());
create policy payments_select_admin on payments for select using (is_admin());
create policy payments_update_admin on payments for update using (is_admin());

alter table refunds enable row level security;
create policy refunds_select_related on refunds for select
  using (exists (
    select 1 from payments p where p.id = payment_id
      and (p.profile_id = auth.uid() or is_admin() or is_staff())
  ));
create policy refunds_write_admin on refunds for insert with check (is_admin());

-- ── partner_earnings / payouts ────────────────────────────────────────────
alter table partner_earnings enable row level security;
create policy partner_earnings_select_self on partner_earnings for select using (partner_id = auth.uid());
create policy partner_earnings_select_admin on partner_earnings for select using (is_admin());

alter table payouts enable row level security;
create policy payouts_select_self on payouts for select using (partner_id = auth.uid());
create policy payouts_select_admin on payouts for select using (is_admin());
create policy payouts_write_admin on payouts for all using (is_admin()) with check (is_admin());

-- ── coupons / coupon_usage ─────────────────────────────────────────────────
alter table coupons enable row level security;
create policy coupons_select_active on coupons for select using (active = true and now() <= expires_at);
create policy coupons_select_admin on coupons for select using (is_admin());
create policy coupons_write_admin on coupons for all using (is_admin()) with check (is_admin());

alter table coupon_usage enable row level security;
create policy coupon_usage_select_self on coupon_usage for select using (profile_id = auth.uid());
create policy coupon_usage_select_admin on coupon_usage for select using (is_admin());

-- ── favorites ─────────────────────────────────────────────────────────────
alter table favorites enable row level security;
create policy favorites_owner_all on favorites for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ── reviews ───────────────────────────────────────────────────────────────
alter table reviews enable row level security;
create policy reviews_select_all on reviews for select using (true);
-- Only the customer on a *completed* order can review it, and only once
-- per target (enforced by the unique indexes in 0008).
create policy reviews_insert_customer on reviews for insert
  with check (
    profile_id = auth.uid()
    and exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid() and o.status = 'delivered')
  );
create policy reviews_delete_admin on reviews for delete using (is_admin());

-- ── notifications ─────────────────────────────────────────────────────────
alter table notifications enable row level security;
create policy notifications_select_self on notifications for select using (profile_id = auth.uid());
create policy notifications_update_self on notifications for update using (profile_id = auth.uid());
create policy notifications_select_admin on notifications for select using (is_admin());
-- Inserted only by trusted server-side code (service-role / security
-- definer RPCs triggered on order/delivery events) — no client insert policy.

-- ── support_tickets / support_messages ────────────────────────────────────
alter table support_tickets enable row level security;
create policy support_tickets_select_self on support_tickets for select using (profile_id = auth.uid());
create policy support_tickets_select_staff on support_tickets for select
  using (current_role_name() in ('staff', 'administrator', 'super_administrator'));
create policy support_tickets_insert_self on support_tickets for insert with check (profile_id = auth.uid());
create policy support_tickets_update_self on support_tickets for update using (profile_id = auth.uid());
create policy support_tickets_update_staff on support_tickets for update
  using (current_role_name() in ('staff', 'administrator', 'super_administrator'));

alter table support_messages enable row level security;
create policy support_messages_select on support_messages for select
  using (exists (
    select 1 from support_tickets t where t.id = ticket_id
      and (t.profile_id = auth.uid() or current_role_name() in ('staff', 'administrator', 'super_administrator'))
  ));
create policy support_messages_insert on support_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from support_tickets t where t.id = ticket_id
        and (t.profile_id = auth.uid() or current_role_name() in ('staff', 'administrator', 'super_administrator'))
    )
  );

-- ── pricing / settings / audit (admin-only surface) ───────────────────────
alter table pricing_settings enable row level security;
create policy pricing_settings_select on pricing_settings for select using (true);
create policy pricing_settings_update_admin on pricing_settings for update using (is_admin());

alter table package_size_fees enable row level security;
create policy package_size_fees_select on package_size_fees for select using (true);
create policy package_size_fees_write_admin on package_size_fees for all using (is_admin()) with check (is_admin());

alter table app_settings enable row level security;
create policy app_settings_select on app_settings for select using (true);
create policy app_settings_write_admin on app_settings for all using (is_admin()) with check (is_admin());

alter table admin_audit_logs enable row level security;
create policy admin_audit_logs_select_admin on admin_audit_logs for select using (is_admin());
create policy admin_audit_logs_insert_admin on admin_audit_logs for insert with check (is_admin());
