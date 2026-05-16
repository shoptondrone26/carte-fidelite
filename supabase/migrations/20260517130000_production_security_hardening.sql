-- Production security hardening:
-- 1) Remove anon/public EXECUTE from exposed RPCs.
-- 2) Route booking cancellation history through a controlled RPC.
-- 3) Prevent direct client inserts into history.
-- 4) Pin search_path on enforce_profile_total_unlocks.

begin;

revoke all on function public.accept_booking(uuid) from public, anon;
revoke all on function public.refuse_booking(uuid) from public, anon;
revoke all on function public.validate_unlock(uuid, smallint) from public, anon;
revoke all on function public.mark_free_used(uuid) from public, anon;
revoke all on function public.create_pending_booking(timestamptz, text) from public, anon;
revoke all on function public.get_occupied_slot_starts(date) from public, anon;
revoke all on function public.has_role(text) from public, anon;
revoke all on function public.is_valid_booking_slot(timestamptz) from public, anon;
revoke all on function public.enqueue_push_from_history() from public, anon, authenticated;
revoke all on function public.enforce_profile_total_unlocks() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.accept_booking(uuid) to authenticated;
grant execute on function public.refuse_booking(uuid) to authenticated;
grant execute on function public.validate_unlock(uuid, smallint) to authenticated;
grant execute on function public.mark_free_used(uuid) to authenticated;
grant execute on function public.create_pending_booking(timestamptz, text) to authenticated;
grant execute on function public.get_occupied_slot_starts(date) to authenticated;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_valid_booking_slot(timestamptz) to authenticated;

grant execute on function public.enqueue_push_from_history() to service_role;
grant execute on function public.enforce_profile_total_unlocks() to service_role;
grant execute on function public.set_updated_at() to service_role;

create or replace function public.cancel_pending_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_profile uuid;
  v_count int;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select profile_id into v_profile
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_profile <> v_uid then
    raise exception 'forbidden';
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id
    and profile_id = v_uid
    and status = 'pending';
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
    jsonb_build_object('booking_id', p_booking_id)
  );
end;
$$;

revoke all on function public.cancel_pending_booking(uuid) from public, anon;
grant execute on function public.cancel_pending_booking(uuid) to authenticated;

drop policy if exists history_insert_rules on public.history;

create or replace function public.enforce_profile_total_unlocks()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.total_unlocks is distinct from old.total_unlocks then
    if not public.has_role('admin') then
      raise exception 'total_unlocks: modification interdite';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_profile_total_unlocks() from public, anon, authenticated;
grant execute on function public.enforce_profile_total_unlocks() to service_role;

commit;
