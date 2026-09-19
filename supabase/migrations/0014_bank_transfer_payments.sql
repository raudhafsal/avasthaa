-- Avas Thaa — 0014: bank transfer slip upload & staff verification
-- Cash and wallet still work as before. Bank transfer adds a manual
-- review step: customer uploads a slip image at checkout, staff
-- approves or rejects it, and only an approved bank-transfer order can
-- be accepted into the kitchen/prep queue.

alter table payments
  add column slip_path text,               -- private storage path, payment-slips bucket
  add column slip_uploaded_at timestamptz,
  add column verified_by uuid references profiles(id),
  add column verified_at timestamptz,
  add column staff_note text;              -- e.g. rejection reason

-- ── storage bucket ────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;

-- Object paths are `{order_id}/{filename}`. A customer may only touch
-- objects under an order that's actually theirs; staff/admin see all.
create or replace function owns_order_for_slip_path(p_object_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from orders
    where id::text = split_part(p_object_name, '/', 1)
      and customer_id = auth.uid()
  );
$$;

create policy payment_slips_insert_customer on storage.objects for insert
  with check (bucket_id = 'payment-slips' and owns_order_for_slip_path(name));
create policy payment_slips_select_customer on storage.objects for select
  using (bucket_id = 'payment-slips' and owns_order_for_slip_path(name));
create policy payment_slips_select_staff on storage.objects for select
  using (bucket_id = 'payment-slips' and (is_staff() or is_admin()));

-- ── payments RLS: customer may attach their own slip, nothing else ───────
-- (status/amount/provider stay staff/admin-only, enforced below by trigger
-- rather than by column-level grants, which Postgres RLS doesn't have.)
create policy payments_update_customer_slip on payments for update
  using (profile_id = auth.uid() and provider = 'bank_transfer')
  with check (profile_id = auth.uid() and provider = 'bank_transfer');
create policy payments_update_staff on payments for update using (is_staff());

create or replace function guard_payment_customer_fields()
returns trigger
language plpgsql
as $$
begin
  if is_staff() or is_admin() then
    return new;
  end if;
  -- A customer's own update may only ever attach/change the slip, plus
  -- the one status transition attach_payment_slip() itself makes
  -- (failed -> pending, i.e. "resubmitted after rejection") — everything
  -- else about status/amount/provider/verification stays staff-only.
  if (new.status is distinct from old.status
      and not (old.status = 'failed' and new.status = 'pending'))
    or new.amount is distinct from old.amount
    or new.provider is distinct from old.provider
    or new.order_id is distinct from old.order_id
    or new.verified_by is distinct from old.verified_by
    or new.verified_at is distinct from old.verified_at then
    raise exception 'Only staff can change payment status, amount, or verification fields';
  end if;
  return new;
end;
$$;
create trigger trg_payments_guard_customer_fields
  before update on payments
  for each row execute function guard_payment_customer_fields();

-- ── customer-facing slip upload ───────────────────────────────────────────
create or replace function attach_payment_slip(p_order_id uuid, p_slip_path text)
returns payments
language plpgsql
security definer set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  select * into v_payment from payments
    where order_id = p_order_id and profile_id = auth.uid() and provider = 'bank_transfer'
    order by created_at desc limit 1;
  if not found then
    raise exception 'No bank transfer payment found for this order';
  end if;

  update payments
    set slip_path = p_slip_path, slip_uploaded_at = now(), status = 'pending', staff_note = null
    where id = v_payment.id
    returning * into v_payment;

  return v_payment;
end;
$$;

-- ── staff verification (the only way payments.status/verified_* change) ──
create or replace function verify_bank_transfer_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_note text default null
)
returns payments
language plpgsql
security definer set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  if not is_staff() and not is_admin() then
    raise exception 'Only staff can verify a bank transfer';
  end if;

  update payments set
    status = (case when p_approve then 'paid' else 'failed' end)::payment_status,
    verified_by = auth.uid(),
    verified_at = now(),
    staff_note = p_note,
    paid_at = case when p_approve then now() else paid_at end
  where id = p_payment_id
  returning * into v_payment;

  if not found then
    raise exception 'Payment not found';
  end if;

  if v_payment.order_id is not null then
    update orders
      set payment_status = (case when p_approve then 'paid' else 'failed' end)::payment_status
      where id = v_payment.order_id;
  end if;

  insert into admin_audit_logs (admin_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'payment.bank_transfer_verify', 'payments', p_payment_id,
    jsonb_build_object('approved', p_approve, 'note', p_note));

  return v_payment;
end;
$$;

-- ── gate: a bank-transfer order can't enter the kitchen until verified ───
create or replace function guard_bank_transfer_before_accept()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and old.payment_method = 'bank_transfer' then
    if not exists (
      select 1 from payments
      where order_id = new.id and provider = 'bank_transfer' and status = 'paid'
    ) then
      raise exception 'This order''s bank transfer has not been verified yet';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_orders_guard_bank_transfer_accept
  before update of status on orders
  for each row execute function guard_bank_transfer_before_accept();

-- Admin-editable bank details shown to customers at checkout — empty
-- until an admin fills them in via app_settings.
insert into app_settings (key, value) values
  ('bank_transfer_details', '{"bank_name": "", "account_name": "", "account_number": "", "instructions": ""}')
on conflict (key) do nothing;
