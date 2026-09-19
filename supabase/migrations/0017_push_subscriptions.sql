-- Avas Thaa — 0017: web push subscriptions
-- Sending the actual push (an HTTP request to the browser's push
-- service) happens in Node via the `web-push` library, not in
-- Postgres — this table just stores what a device gave us so the
-- server-side notify helper can look it up.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);
create index idx_push_subscriptions_profile on push_subscriptions (profile_id);

alter table push_subscriptions enable row level security;
create policy push_subscriptions_owner_all on push_subscriptions for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
-- No staff/admin select policy: reading another profile's subscription
-- to actually send a push happens server-side via the service-role
-- client (see lib/services/push.ts), only after send_notification()
-- has already authorized the notification itself — not through a
-- client-facing RLS policy, since there's no legitimate reason for any
-- session to browse other users' push endpoints directly.
