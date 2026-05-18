-- Admin booking lifecycle: accepted bookings stay actionable until unlock validation.
-- This cancellation only updates the reservation and audit history.

begin;

create or replace function public.admin_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_profile uuid;
  v_status text;
  v_starts_at timestamptz;
  v_count int;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select profile_id, status, starts_at
    into v_profile, v_status, v_starts_at
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_status not in ('pending', 'accepted') then
    raise exception 'invalid_state';
  end if;

  update public.bookings
  set
    status = 'cancelled',
    updated_at = now()
  where id = p_booking_id
    and status in ('pending', 'accepted');
  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'invalid_state';
  end if;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload
  )
  values (
    v_profile,
    v_uid,
    'booking_cancelled',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'booking_id', p_booking_id,
      'previous_status', v_status,
      'starts_at', v_starts_at,
      'cancelled_by', 'admin'
    )
  );
end;
$$;

revoke all on function public.admin_cancel_booking(uuid) from public, anon;
grant execute on function public.admin_cancel_booking(uuid) to authenticated;

commit;
