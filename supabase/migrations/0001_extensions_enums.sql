-- Avas Thaa — 0001: extensions & shared enums
-- Enums are used (rather than free-text + CHECK) so the DB itself is the
-- single source of truth for valid states; app code and Supabase-generated
-- TS types both derive from these.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "postgis"; -- lat/lng distance queries for nearby search & partner assignment

-- Businesses (restaurants/shops) are staff-managed records with no login
-- of their own — there is deliberately no 'restaurant_owner' / 'shop_owner'
-- role. Any 'staff' account can manage any business; 'staff' is
-- distinguished from 'administrator' in that staff run day-to-day
-- catalog/order operations but don't get the admin-only surfaces
-- (pricing, payouts, user management, audit log).
create type user_role as enum (
  'customer',
  'delivery_partner',
  'staff',
  'administrator',
  'super_administrator'
);

create type account_status as enum ('active', 'suspended', 'disabled', 'pending_verification');

create type business_type as enum (
  'restaurant', 'grocery', 'pharmacy', 'electronics', 'clothing',
  'hardware', 'bakery', 'cafe', 'general_store', 'other'
);

create type approval_status as enum ('pending', 'approved', 'rejected', 'suspended');

create type order_status as enum (
  'pending', 'accepted', 'rejected', 'preparing', 'ready',
  'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'
);

create type delivery_stage as enum (
  'awaiting_pickup', 'picked_up', 'awaiting_boat', 'in_transit_boat',
  'arrived_destination', 'out_for_delivery', 'delivered'
);

create type delivery_kind as enum ('food_order', 'shop_order', 'parcel');
create type delivery_type as enum ('standard', 'express', 'scheduled', 'island_to_island');
create type package_size as enum ('small', 'medium', 'large', 'custom');
create type vehicle_type as enum ('motorcycle', 'bicycle', 'car', 'pickup', 'boat', 'other');

create type delivery_method as enum ('door_delivery', 'pickup', 'scheduled');
create type payment_method as enum ('cash', 'online', 'wallet');
create type payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');

create type wallet_txn_type as enum ('credit', 'debit', 'refund', 'adjustment');
create type discount_type as enum ('percentage', 'fixed');

create type notification_channel as enum ('push', 'sms', 'email', 'whatsapp', 'in_app');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- updated_at auto-maintenance, reused by every table below
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
