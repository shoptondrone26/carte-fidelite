-- Allow clients to cancel accepted bookings until 20 minutes before the appointment.

begin;

create or replace function public.cancel_pending_booking(p_booking_id uuid)
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
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select profile_id, status, starts_at
    into v_profile, v_status, v_starts_at
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_profile <> v_uid then
    raise exception 'forbidden';
  end if;

  if v_status not in ('pending', 'accepted') then
    raise exception 'invalid_state';
  end if;

  if v_status = 'accepted' and v_starts_at <= now() + interval '20 minutes' then
    raise exception 'too_late';
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id
    and profile_id = v_uid
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
  ) values (
    v_uid,
    v_uid,
    'booking_cancelled',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'booking_id', p_booking_id,
      'previous_status', v_status,
      'starts_at', v_starts_at
    )
  );
end;
$$;

revoke all on function public.cancel_pending_booking(uuid) from public, anon;
grant execute on function public.cancel_pending_booking(uuid) to authenticated;

commit;
