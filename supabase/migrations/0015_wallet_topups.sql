-- Avas Thaa — 0015: wallet top-ups
-- The `payments` table's CHECK (order_id is not null or delivery_id is
-- not null) means a standalone wallet top-up can't live there — hence a
-- dedicated table, verified the same way bank-transfer order payments
-- are (slip upload -> staff review -> credited).

create table wallet_topups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  slip_path text not null,
  status payment_status not null default 'pending',
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  staff_note text,
  created_at timestamptz not null default now()
);
create index idx_wallet_topups_profile on wallet_topups (profile_id, created_at desc);
create index idx_wallet_topups_pending on wallet_topups (status) where status = 'pending';

alter table wallet_topups enable row level security;
create policy wallet_topups_select_self on wallet_topups for select using (profile_id = auth.uid());
create policy wallet_topups_select_staff on wallet_topups for select using (is_staff() or is_admin());
create policy wallet_topups_insert_self on wallet_topups for insert with check (profile_id = auth.uid());
-- No client update policy at all: status/verified_* change only via
-- verify_wallet_topup() below (security definer), never a direct write.

-- ── storage bucket for top-up slips ───────────────────────────────────
-- Separate from payment-slips (which is keyed by order id): here the
-- path is `{profile_id}/{filename}`, so ownership is a straight column
-- comparison rather than a table lookup.
insert into storage.buckets (id, name, public)
values ('wallet-topup-slips', 'wallet-topup-slips', false)
on conflict (id) do nothing;

create policy wallet_topup_slips_insert_customer on storage.objects for insert
  with check (bucket_id = 'wallet-topup-slips' and split_part(name, '/', 1) = auth.uid()::text);
create policy wallet_topup_slips_select_customer on storage.objects for select
  using (bucket_id = 'wallet-topup-slips' and split_part(name, '/', 1) = auth.uid()::text);
create policy wallet_topup_slips_select_staff on storage.objects for select
  using (bucket_id = 'wallet-topup-slips' and (is_staff() or is_admin()));

-- ── staff verification ──────────────────────────────────────────────────
create or replace function verify_wallet_topup(
  p_topup_id uuid,
  p_approve boolean,
  p_note text default null
)
returns wallet_topups
language plpgsql
security definer set search_path = public
as $$
declare
  v_topup wallet_topups%rowtype;
begin
  if not is_staff() and not is_admin() then
    raise exception 'Only staff can verify a wallet top-up';
  end if;

  update wallet_topups set
    status = (case when p_approve then 'paid' else 'failed' end)::payment_status,
    verified_by = auth.uid(),
    verified_at = now(),
    staff_note = p_note
  where id = p_topup_id and status = 'pending'
  returning * into v_topup;

  if not found then
    raise exception 'Top-up not found or already processed';
  end if;

  if p_approve then
    perform adjust_wallet_balance(
      v_topup.profile_id, 'credit', v_topup.amount,
      'Wallet top-up verified', null, null
    );
  end if;

  insert into admin_audit_logs (admin_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'wallet.topup_verify', 'wallet_topups', p_topup_id,
    jsonb_build_object('approved', p_approve, 'amount', v_topup.amount, 'note', p_note));

  return v_topup;
end;
$$;
