-- Step 5 (validated product rules):
-- 1) Accepting a booking no longer increments total_unlocks (reservation ≠ déblocage).
-- 2) New RPC validate_unlock: admin-only, +1 total_unlocks, history unlock_validated.
-- 3) Only admins may change total_unlocks on profiles (remove staff from trigger).

-- ---------------------------------------------------------------------------
-- accept_booking: validate reservation only + audit booking_accepted
-- ---------------------------------------------------------------------------
create or replace function public.accept_booking(p_booking_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_count int;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select
    profile_id into v_profile
  from
    public.bookings
  where
    id = p_booking_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;

  update public.bookings
  set
    status = 'accepted',
    validated = true,
    updated_at = now()
  where
    id = p_booking_id
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
    payload)
  values (
    v_profile,
    auth.uid(),
    'booking_accepted',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'booking_id',
      p_booking_id));

end;
$$;

-- ---------------------------------------------------------------------------
-- validate_unlock: fidélité (+1) — réservé aux admins
-- ---------------------------------------------------------------------------
create or replace function public.validate_unlock(p_profile_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  update public.profiles
  set
    total_unlocks = total_unlocks + 1,
    updated_at = now()
  where
    id = p_profile_id;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'not_found';
  end if;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload)
  values (
    p_profile_id,
    auth.uid(),
    'unlock_validated',
    'profile',
    p_profile_id,
    jsonb_build_object('profile_id', p_profile_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: total_unlocks — admin uniquement (plus staff)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_total_unlocks()
returns trigger
language plpgsql
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

revoke all on function public.validate_unlock(uuid) from public;

grant execute on function public.validate_unlock(uuid) to authenticated;
