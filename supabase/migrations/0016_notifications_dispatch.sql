-- Avas Thaa — 0016: notification dispatch
-- notifications had RLS enabled with no insert policy at all — the
-- comment in 0012 said "inserted only by trusted server-side code" but
-- that code never actually existed. This closes the gap: a
-- security-definer function, callable only by staff/admin or the
-- delivery partner assigned to the referenced delivery, so a plain
-- customer session can't use it to spam other users.

create or replace function send_notification(
  p_profile_id uuid,
  p_category text,
  p_title text,
  p_body text,
  p_reference_order_id uuid default null,
  p_reference_delivery_id uuid default null
)
returns notifications
language plpgsql
security definer set search_path = public
as $$
declare
  v_row notifications%rowtype;
  v_authorized boolean := false;
begin
  if is_staff() or is_admin() then
    v_authorized := true;
  elsif p_reference_delivery_id is not null and is_partner_for_delivery(p_reference_delivery_id) then
    v_authorized := true;
  end if;

  if not v_authorized then
    raise exception 'Not authorized to send this notification';
  end if;

  insert into notifications (profile_id, category, title, body, reference_order_id, reference_delivery_id)
  values (p_profile_id, p_category, p_title, p_body, p_reference_order_id, p_reference_delivery_id)
  returning * into v_row;

  return v_row;
end;
$$;
