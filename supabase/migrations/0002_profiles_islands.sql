-- Avas Thaa — 0002: profiles & Tha Atoll islands

create table islands (
  id uuid primary key default gen_random_uuid(),
  island_name text not null,
  island_name_dhivehi text not null,
  atoll text not null default 'Tha',
  latitude double precision,
  longitude double precision,
  delivery_enabled boolean not null default true,
  island_delivery_fee numeric(10, 2) not null default 0,
  status approval_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_islands_updated_at before update on islands
  for each row execute function set_updated_at();

-- profiles.id == auth.users.id (1:1). Created by a trigger on signup so a
-- row always exists before any other table references it.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  email text unique,
  profile_image text,
  role user_role not null default 'customer',
  island_id uuid references islands(id),
  address text,
  latitude double precision,
  longitude double precision,
  account_status account_status not null default 'active',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'dv')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Populate profiles automatically when a Supabase Auth user is created.
-- full_name/role arrive via the signup call's options.data (see auth flow).
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New user'),
    new.phone,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'home', -- home | work | other (free text, admin-editable list in app_settings)
  island_id uuid not null references islands(id),
  address_line text not null,
  latitude double precision,
  longitude double precision,
  contact_phone text,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_addresses_updated_at before update on addresses
  for each row execute function set_updated_at();
